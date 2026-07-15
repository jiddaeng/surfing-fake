import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  AnswerValue,
  AppNotification,
  ApplicationQuestion,
  ApplicationStatus,
  Club,
  ClubApplication,
  DemoStore,
  PendingAccount,
  Profile,
  RecruitmentSettings,
} from '../types'
import { isDemoMode, supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { uid } from '../lib/utils'
import { createDemoStore, readDemoAccounts, saveDemoAccount } from '../data/demo'
import { CLUB_CATALOG, LEGACY_DEMO_CLUB_NAMES, catalogClubId, catalogDescription, catalogQuestionId, catalogSummary } from '../data/clubs'

interface DataContextValue {
  clubs: Club[]
  questions: ApplicationQuestion[]
  applications: ClubApplication[]
  profiles: Profile[]
  pendingAccounts: PendingAccount[]
  accountApprovalReady: boolean
  favoriteClubIds: string[]
  notifications: AppNotification[]
  settings: RecruitmentSettings | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  toggleFavorite: (clubId: string) => Promise<void>
  saveDraft: (clubId: string, answers: Record<string, AnswerValue>) => Promise<ClubApplication>
  submitApplication: (clubId: string, answers: Record<string, AnswerValue>) => Promise<void>
  setApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>
  updateClub: (clubId: string, values: Partial<Club>) => Promise<void>
  createClub: (values: Pick<Club, 'name' | 'category' | 'summary' | 'description' | 'capacity' | 'color'>) => Promise<Club>
  replaceQuestions: (clubId: string, questions: ApplicationQuestion[]) => Promise<void>
  updateSettings: (settings: RecruitmentSettings) => Promise<void>
  syncOfficialClubCatalog: () => Promise<void>
  approveAccount: (userId: string) => Promise<void>
  promoteStudentToLeader: (profileId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  uploadClubLogo: (clubId: string, file: File) => Promise<string>
}

const DataContext = createContext<DataContextValue | null>(null)
const demoStoreKey = 'surfing-fake:demo-store:v2'

const readDemoStore = (): DemoStore => {
  try {
    const saved = JSON.parse(localStorage.getItem(demoStoreKey) || 'null')
    if (saved?.clubs && saved?.settings) return saved
  } catch { /* use a fresh demo */ }
  const fresh = createDemoStore()
  localStorage.setItem(demoStoreKey, JSON.stringify(fresh))
  return fresh
}

const writeDemoStore = (store: DemoStore) => localStorage.setItem(demoStoreKey, JSON.stringify(store))

const mapClub = (row: any): Club => ({
  id: row.id,
  name: row.name,
  category: row.category,
  summary: row.summary,
  description: row.description,
  logoUrl: row.logo_url ?? undefined,
  color: row.color,
  capacity: row.capacity,
  leaderId: row.leader_id ?? '',
  leaderName: row.leader_name ?? row.leader?.name ?? '동아리장',
  isPublished: row.is_published,
  createdAt: row.created_at,
})

const persistedClubsFromRows = (rows: any[]): Club[] => rows.map(mapClub)

const mapQuestion = (row: any): ApplicationQuestion => ({
  id: row.id,
  clubId: row.club_id,
  type: row.type,
  label: row.label,
  description: row.description ?? undefined,
  required: row.required,
  options: row.options ?? undefined,
  order: row.display_order,
})

const mapApplication = (row: any): ClubApplication => {
  const decision = Array.isArray(row.application_decisions)
    ? row.application_decisions[0]
    : row.application_decisions

  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    status: decision?.result ?? row.status,
    answers: Object.fromEntries((row.application_answers ?? []).map((item: any) => [item.question_id, item.answer])),
    submittedAt: row.submitted_at ?? undefined,
    updatedAt: row.updated_at,
  }
}

const mapProfile = (row: any): Profile => ({
  id: row.id,
  email: row.email,
  name: row.name,
  studentNumber: row.student_number ?? undefined,
  role: row.role,
  avatarUrl: row.avatar_url ?? undefined,
  isActive: row.is_active,
})

export function DataProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([])
  const [applications, setApplications] = useState<ClubApplication[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([])
  const [accountApprovalReady, setAccountApprovalReady] = useState(false)
  const [favoriteClubIds, setFavoriteClubIds] = useState<string[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [settings, setSettings] = useState<RecruitmentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyDemoStore = useCallback((store: DemoStore) => {
    const withCurrentProfile = profile && !store.profiles.some((item) => item.id === profile.id)
      ? { ...store, profiles: [...store.profiles, profile] }
      : store
    if (withCurrentProfile !== store) writeDemoStore(withCurrentProfile)
    setClubs(withCurrentProfile.clubs)
    setQuestions(withCurrentProfile.questions)
    setApplications(withCurrentProfile.applications)
    setProfiles(withCurrentProfile.profiles)
    setFavoriteClubIds(profile ? withCurrentProfile.favorites[profile.id] || [] : [])
    setNotifications(profile ? withCurrentProfile.notifications.filter((item) => item.userId === profile.id) : [])
    setSettings(withCurrentProfile.settings)
    setError(null)
    setLoading(false)
  }, [profile])

  const updateDemoStore = (update: (store: DemoStore) => DemoStore) => {
    const next = update(readDemoStore())
    writeDemoStore(next)
    applyDemoStore(next)
    return next
  }

  const reload = useCallback(async () => {
    if (isDemoMode) {
      setPendingAccounts([])
      setAccountApprovalReady(false)
      applyDemoStore(readDemoStore())
      return
    }
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [clubsResult, questionsResult, settingsResult] = await Promise.all([
        supabase.from('clubs').select('*, leader:profiles!clubs_leader_id_fkey(name)').order('name'),
        supabase.from('application_questions').select('*').order('display_order'),
        supabase.from('recruitment_settings').select('*').eq('id', 'global').single(),
      ])
      if (clubsResult.error || questionsResult.error || settingsResult.error) {
        throw new Error('Supabase 테이블을 불러오지 못했습니다. 초기 SQL을 실행했는지 확인해주세요.')
      }
      const persistedClubs = persistedClubsFromRows(clubsResult.data ?? [])
      setClubs(persistedClubs)
      const mappedQuestions = (questionsResult.data ?? []).map(mapQuestion)
      setQuestions(mappedQuestions)
      setSettings({
        id: settingsResult.data.id,
        recruitmentStartAt: settingsResult.data.recruitment_start_at,
        recruitmentEndAt: settingsResult.data.recruitment_end_at,
        resultAnnouncementAt: settingsResult.data.result_announcement_at,
        maxApplications: settingsResult.data.max_applications,
      })

      if (!profile) {
        setApplications([])
        setProfiles([])
        setPendingAccounts([])
        setAccountApprovalReady(false)
        setFavoriteClubIds([])
        setNotifications([])
        return
      }

      const [appsResult, profilesResult, favoritesResult, notificationsResult] = await Promise.all([
        supabase.from('applications').select('*, application_answers(question_id, answer), application_decisions(result)').order('updated_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('favorites').select('club_id'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ])
      if (appsResult.error) throw appsResult.error
      setApplications((appsResult.data ?? []).map(mapApplication))
      setProfiles((profilesResult.data ?? []).map(mapProfile))
      setFavoriteClubIds((favoritesResult.data ?? []).map((item) => item.club_id))
      setNotifications(
        (notificationsResult.data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          message: row.message,
          read: row.read,
          availableAt: row.available_at,
          createdAt: row.created_at,
        })),
      )

      if (profile.role === 'admin') {
        const { data: pendingRows, error: pendingError } = await supabase.rpc('list_pending_accounts')
        if (pendingError?.code === 'PGRST202') {
          setPendingAccounts([])
          setAccountApprovalReady(false)
        } else if (pendingError) {
          throw pendingError
        } else {
          setPendingAccounts((pendingRows ?? []).map((row: any) => ({
            id: row.user_id,
            name: row.display_name,
            studentNumber: row.student_number ?? undefined,
            requestedAt: row.requested_at,
          })))
          setAccountApprovalReady(true)
        }
      } else {
        setPendingAccounts([])
        setAccountApprovalReady(false)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [applyDemoStore, profile])

  useEffect(() => {
    void reload()
  }, [reload])

  const toggleFavorite = async (clubId: string) => {
    if (isDemoMode) {
      if (!profile) throw new Error('로그인이 필요합니다.')
      updateDemoStore((store) => {
        const current = store.favorites[profile.id] || []
        const next = current.includes(clubId) ? current.filter((id) => id !== clubId) : [...current, clubId]
        return { ...store, favorites: { ...store.favorites, [profile.id]: next } }
      })
      return
    }
    if (!supabase || !profile) throw new Error('로그인이 필요합니다.')
    if (favoriteClubIds.includes(clubId)) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', profile.id).eq('club_id', clubId)
      if (error) throw error
      setFavoriteClubIds((items) => items.filter((id) => id !== clubId))
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: profile.id, club_id: clubId })
      if (error) throw error
      setFavoriteClubIds((items) => [...items, clubId])
    }
  }

  const persistAnswers = async (applicationId: string, answers: Record<string, AnswerValue>) => {
    if (!supabase) return
    const emptyQuestionIds = Object.entries(answers)
      .filter(([, answer]) => (Array.isArray(answer) ? answer.length === 0 : answer.trim().length === 0))
      .map(([questionId]) => questionId)
    if (emptyQuestionIds.length) {
      const { error } = await supabase
        .from('application_answers')
        .delete()
        .eq('application_id', applicationId)
        .in('question_id', emptyQuestionIds)
      if (error) throw error
    }
    const rows = Object.entries(answers)
      .filter(([, answer]) => (Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0))
      .map(([questionId, answer]) => ({ application_id: applicationId, question_id: questionId, answer }))
    if (rows.length) {
      const { error } = await supabase.from('application_answers').upsert(rows, { onConflict: 'application_id,question_id' })
      if (error) throw error
    }
  }

  const saveDraft = async (clubId: string, answers: Record<string, AnswerValue>) => {
    if (isDemoMode) {
      if (!profile) throw new Error('로그인이 필요합니다.')
      const store = readDemoStore()
      const existing = store.applications.find((app) => app.clubId === clubId && app.userId === profile.id)
      const draft: ClubApplication = {
        id: existing?.id || uid(),
        clubId,
        userId: profile.id,
        status: 'draft',
        answers,
        updatedAt: new Date().toISOString(),
      }
      updateDemoStore((current) => ({
        ...current,
        applications: [...current.applications.filter((app) => app.id !== draft.id), draft],
      }))
      return draft
    }
    if (!supabase || !profile) throw new Error('로그인이 필요합니다.')
    const existing = applications.find((app) => app.clubId === clubId && app.userId === profile.id)
    let applicationId = existing?.id
    if (!applicationId) {
      const { data, error } = await supabase
        .from('applications')
        .insert({ club_id: clubId, user_id: profile.id, status: 'draft' })
        .select()
        .single()
      if (error) throw error
      applicationId = data.id
    }
    const savedApplicationId = applicationId as string
    await persistAnswers(savedApplicationId, answers)
    const draft: ClubApplication = {
      id: savedApplicationId,
      clubId,
      userId: profile.id,
      status: 'draft',
      answers,
      updatedAt: new Date().toISOString(),
    }
    setApplications((items) => [...items.filter((app) => app.id !== savedApplicationId), draft])
    return draft
  }

  const submitApplication = async (clubId: string, answers: Record<string, AnswerValue>) => {
    if (isDemoMode) {
      const draft = await saveDraft(clubId, answers)
      updateDemoStore((store) => ({
        ...store,
        applications: store.applications.map((app) => app.id === draft.id
          ? { ...app, status: 'submitted', submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : app),
      }))
      return
    }
    if (!supabase || !profile) throw new Error('로그인이 필요합니다.')
    const draft = await saveDraft(clubId, answers)
    const { error } = await supabase
      .from('applications')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', draft.id)
    if (error) throw error
    await reload()
  }

  const setApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({
        ...store,
        applications: store.applications.map((app) => app.id === applicationId
          ? { ...app, status, updatedAt: new Date().toISOString() }
          : app),
      }))
      return
    }
    if (!supabase || !profile) return
    if (status === 'accepted' || status === 'rejected') {
      const { error } = await supabase.from('application_decisions').upsert(
        { application_id: applicationId, result: status, decided_by: profile.id, decided_at: new Date().toISOString() },
        { onConflict: 'application_id' },
      )
      if (error) throw error
      const { error: reviewError } = await supabase.from('applications').update({ status: 'reviewing' }).eq('id', applicationId)
      if (reviewError) throw reviewError
      await reload()
      return
    }
    const { error: decisionError } = await supabase.from('application_decisions').delete().eq('application_id', applicationId)
    if (decisionError) throw decisionError
    const { error } = await supabase.from('applications').update({ status }).eq('id', applicationId)
    if (error) throw error
    await reload()
  }

  const updateClub = async (clubId: string, values: Partial<Club>) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({
        ...store,
        clubs: store.clubs.map((club) => club.id === clubId ? { ...club, ...values } : club),
      }))
      return
    }
    if (!supabase) return
    const payload: Record<string, unknown> = {}
    if (values.name !== undefined) payload.name = values.name
    if (values.category !== undefined) payload.category = values.category
    if (values.summary !== undefined) payload.summary = values.summary
    if (values.description !== undefined) payload.description = values.description
    if (values.capacity !== undefined) payload.capacity = values.capacity
    if (values.color !== undefined) payload.color = values.color
    if (values.logoUrl !== undefined) payload.logo_url = values.logoUrl
    if (values.isPublished !== undefined) payload.is_published = values.isPublished
    const { error } = await supabase.from('clubs').update(payload).eq('id', clubId)
    if (error) throw error
    await reload()
  }

  const createClub = async (values: Pick<Club, 'name' | 'category' | 'summary' | 'description' | 'capacity' | 'color'>) => {
    if (isDemoMode) {
      if (!profile) throw new Error('로그인이 필요합니다.')
      const club: Club = {
        ...values,
        id: uid(),
        leaderId: profile.id,
        leaderName: profile.name,
        isPublished: true,
        createdAt: new Date().toISOString(),
      }
      updateDemoStore((store) => ({ ...store, clubs: [...store.clubs, club] }))
      return club
    }
    if (!supabase || !profile) throw new Error('로그인이 필요합니다.')
    const clubSelection = '*, leader:profiles!clubs_leader_id_fkey(name)'
    const { data: existingClub, error: existingError } = await supabase
      .from('clubs')
      .select(clubSelection)
      .eq('leader_id', profile.id)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message || '기존 동아리 정보를 확인하지 못했습니다.')
    if (existingClub) {
      const { data: updatedClub, error: updateError } = await supabase
        .from('clubs')
        .update({
          name: values.name,
          category: values.category,
          summary: values.summary,
          description: values.description,
          capacity: values.capacity,
          color: values.color,
        })
        .eq('id', existingClub.id)
        .select(clubSelection)
        .single()
      if (updateError) throw new Error(updateError.message || '기존 동아리 정보를 저장하지 못했습니다.')
      const club = mapClub(updatedClub)
      setClubs((items) => items.some((item) => item.id === club.id)
        ? items.map((item) => item.id === club.id ? club : item)
        : [...items, club])
      return club
    }
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: values.name,
        category: values.category,
        summary: values.summary,
        description: values.description,
        capacity: values.capacity,
        color: values.color,
        leader_id: profile.id,
        leader_name: profile.name,
      })
      .select(clubSelection)
      .single()
    if (error?.code === '23505') {
      if (error.message.includes('clubs_name_key') || error.details?.includes('(name)')) {
        throw new Error('이미 사용 중인 동아리 이름입니다. 다른 이름을 입력해주세요.')
      }
      throw new Error('이 계정에는 이미 등록된 동아리가 있습니다. 페이지를 새로고침해주세요.')
    }
    if (error) throw new Error(error.message || '동아리를 저장하지 못했습니다.')
    const club = mapClub(data)
    setClubs((items) => [...items, club])
    return club
  }

  const replaceQuestions = async (clubId: string, newQuestions: ApplicationQuestion[]) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({
        ...store,
        questions: [...store.questions.filter((question) => question.clubId !== clubId), ...newQuestions],
      }))
      return
    }
    if (!supabase) return
    const { error: deleteError } = await supabase.from('application_questions').delete().eq('club_id', clubId)
    if (deleteError) throw deleteError
    if (newQuestions.length) {
      const { error } = await supabase.from('application_questions').insert(
        newQuestions.map((question, index) => ({
          id: question.id || uid(),
          club_id: clubId,
          type: question.type,
          label: question.label,
          description: question.description || null,
          required: question.required,
          options: ['single', 'multiple'].includes(question.type) ? question.options ?? [] : null,
          display_order: index,
        })),
      )
      if (error) throw error
    }
    await reload()
  }

  const updateSettings = async (next: RecruitmentSettings) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({ ...store, settings: next }))
      return
    }
    if (!supabase) return
    const { error } = await supabase
      .from('recruitment_settings')
      .update({
        recruitment_start_at: next.recruitmentStartAt,
        recruitment_end_at: next.recruitmentEndAt,
        result_announcement_at: next.resultAnnouncementAt,
        max_applications: next.maxApplications,
      })
      .eq('id', 'global')
    if (error) throw error
    setSettings(next)
  }

  const syncOfficialClubCatalog = async () => {
    if (isDemoMode) {
      const official = createDemoStore()
      updateDemoStore((store) => ({ ...store, clubs: official.clubs, questions: official.questions }))
      return
    }
    if (!supabase || profile?.role !== 'admin') throw new Error('관리자 계정으로 로그인해주세요.')

    const { data: currentRows, error: currentError } = await supabase.from('clubs').select('*')
    if (currentError) throw currentError
    const currentByName = new Map((currentRows ?? []).map((row: any) => [row.name, row]))
    const rows = CLUB_CATALOG.map((entry, index) => {
      const current: any = currentByName.get(entry.name)
      const summaryIsPlaceholder = !current?.summary || current.summary === '동아리 소개 준비 중입니다.'
      const descriptionIsPlaceholder = !current?.description || current.description.includes('동아리 소개 준비 중')
      return {
        id: current?.id ?? catalogClubId(index),
        name: entry.name,
        category: entry.category,
        summary: summaryIsPlaceholder ? catalogSummary(entry.category) : current.summary,
        description: descriptionIsPlaceholder ? catalogDescription(entry.name, entry.category) : current.description,
        color: current?.color ?? entry.color,
        capacity: current?.capacity ?? 10,
        leader_name: entry.leaderName ?? current?.leader_name ?? '담당 동아리장',
        is_published: true,
      }
    })

    const { error: hideError } = await supabase.from('clubs').update({ is_published: false }).in('name', [...LEGACY_DEMO_CLUB_NAMES])
    if (hideError) throw hideError
    const { data: officialRows, error: upsertError } = await supabase.from('clubs').upsert(rows, { onConflict: 'name' }).select('id, name')
    if (upsertError) throw upsertError

    const officialIds = (officialRows ?? []).map((row) => row.id)
    const { data: existingQuestions, error: questionReadError } = await supabase
      .from('application_questions')
      .select('club_id')
      .in('club_id', officialIds)
    if (questionReadError) throw questionReadError
    const clubsWithQuestions = new Set((existingQuestions ?? []).map((row) => row.club_id))
    const missingQuestions = (officialRows ?? []).flatMap((row) => {
      if (clubsWithQuestions.has(row.id)) return []
      const index = CLUB_CATALOG.findIndex((entry) => entry.name === row.name)
      return [{
        id: catalogQuestionId(index),
        club_id: row.id,
        type: 'long',
        label: `${row.name}에 지원한 이유를 알려주세요.`,
        required: true,
        display_order: 0,
      }]
    })
    if (missingQuestions.length) {
      const { error } = await supabase.from('application_questions').insert(missingQuestions)
      if (error) throw error
    }
    await reload()
  }

  const promoteStudentToLeader = async (profileId: string) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({
        ...store,
        profiles: store.profiles.map((item) => item.id === profileId ? { ...item, role: 'leader' } : item),
      }))
      const account = readDemoAccounts().find((item) => item.id === profileId)
      if (account) saveDemoAccount({ ...account, role: 'leader' })
      return
    }
    if (!supabase) throw new Error('Supabase 연결이 필요합니다.')
    const { data, error } = await supabase
      .rpc('promote_student_to_leader', { target_profile_id: profileId })
    let row: any = Array.isArray(data) ? data[0] : data
    if (error) {
      if (error.code !== 'PGRST202') throw new Error(error.message || '계정 역할을 변경하지 못했습니다.')
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'leader' })
        .eq('id', profileId)
        .eq('role', 'student')
        .select()
        .single()
      if (updateError) throw new Error(updateError.message || '계정 역할을 변경하지 못했습니다.')
      row = updated
    }
    if (!row || row.role !== 'leader') throw new Error('승격 결과를 확인하지 못했습니다. 다시 시도해주세요.')
    setProfiles((items) => items.map((item) => (item.id === profileId ? mapProfile(row) : item)))
  }

  const approveAccount = async (userId: string) => {
    if (isDemoMode) throw new Error('시연 관리자 계정은 실제 가입 계정을 승인할 수 없습니다. Supabase 관리자 계정으로 로그인해주세요.')
    if (!supabase || profile?.role !== 'admin') throw new Error('관리자 계정으로 로그인해주세요.')
    const { error } = await supabase.rpc('approve_account', { target_user_id: userId })
    if (error?.code === 'PGRST202') throw new Error('계정 승인 DB 기능이 아직 설치되지 않았습니다.')
    if (error) throw new Error(error.message || '계정을 승인하지 못했습니다.')
    setPendingAccounts((items) => items.filter((item) => item.id !== userId))
  }

  const markNotificationRead = async (notificationId: string) => {
    if (isDemoMode) {
      updateDemoStore((store) => ({
        ...store,
        notifications: store.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item),
      }))
      return
    }
    if (!supabase) return
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    if (error) throw error
    setNotifications((items) => items.map((item) => (item.id === notificationId ? { ...item, read: true } : item)))
  }

  const uploadClubLogo = async (clubId: string, file: File) => {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const extension = extensions[file.type]
    if (!extension) throw new Error('PNG, JPG, WEBP 이미지만 업로드할 수 있습니다.')
    if (file.size <= 0 || file.size > 2 * 1024 * 1024) throw new Error('로고 이미지는 2MB 이하여야 합니다.')
    if (isDemoMode) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
        reader.readAsDataURL(file)
      })
    }
    if (!supabase) throw new Error('Supabase 연결이 필요합니다.')
    const path = `${clubId}/logo-${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('club-logos').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    return supabase.storage.from('club-logos').getPublicUrl(path).data.publicUrl
  }

  const value: DataContextValue = {
    clubs,
    questions,
    applications,
    profiles,
    pendingAccounts,
    accountApprovalReady,
    favoriteClubIds,
    notifications,
    settings,
    loading,
    error,
    reload,
    toggleFavorite,
    saveDraft,
    submitApplication,
    setApplicationStatus,
    updateClub,
    createClub,
    replaceQuestions,
    updateSettings,
    syncOfficialClubCatalog,
    approveAccount,
    promoteStudentToLeader,
    markNotificationRead,
    uploadClubLogo,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData는 DataProvider 안에서 사용해야 합니다.')
  return context
}
