import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AnswerValue,
  AppNotification,
  ApplicationQuestion,
  ApplicationStatus,
  Club,
  ClubApplication,
  Profile,
  RecruitmentSettings,
} from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { uid } from '../lib/utils'

interface DataContextValue {
  clubs: Club[]
  questions: ApplicationQuestion[]
  applications: ClubApplication[]
  profiles: Profile[]
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
  promoteStudentToLeader: (profileId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  uploadClubLogo: (clubId: string, file: File) => Promise<string>
}

const DataContext = createContext<DataContextValue | null>(null)

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
  leaderName: row.leader?.name ?? row.leader_name ?? '동아리장',
  isPublished: row.is_published,
  createdAt: row.created_at,
})

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
  const [favoriteClubIds, setFavoriteClubIds] = useState<string[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [settings, setSettings] = useState<RecruitmentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
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
      setClubs((clubsResult.data ?? []).map(mapClub))
      setQuestions((questionsResult.data ?? []).map(mapQuestion))
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [profile?.id])

  const toggleFavorite = async (clubId: string) => {
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
    const rows = Object.entries(answers)
      .filter(([, answer]) => (Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0))
      .map(([questionId, answer]) => ({ application_id: applicationId, question_id: questionId, answer }))
    if (rows.length) {
      const { error } = await supabase.from('application_answers').upsert(rows, { onConflict: 'application_id,question_id' })
      if (error) throw error
    }
  }

  const saveDraft = async (clubId: string, answers: Record<string, AnswerValue>) => {
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
    if (!supabase || !profile) throw new Error('로그인이 필요합니다.')
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
      .select('*, leader:profiles!clubs_leader_id_fkey(name)')
      .single()
    if (error) throw error
    const club = mapClub(data)
    setClubs((items) => [...items, club])
    return club
  }

  const replaceQuestions = async (clubId: string, newQuestions: ApplicationQuestion[]) => {
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

  const promoteStudentToLeader = async (profileId: string) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'leader' })
      .eq('id', profileId)
      .eq('role', 'student')
      .select()
      .single()
    if (error) throw error
    setProfiles((items) => items.map((item) => (item.id === profileId ? mapProfile(data) : item)))
  }

  const markNotificationRead = async (notificationId: string) => {
    if (!supabase) return
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
    if (error) throw error
    setNotifications((items) => items.map((item) => (item.id === notificationId ? { ...item, read: true } : item)))
  }

  const uploadClubLogo = async (clubId: string, file: File) => {
    if (!supabase) throw new Error('Supabase 연결이 필요합니다.')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${clubId}/logo-${Date.now()}.${extension}`
    const { error } = await supabase.storage.from('club-logos').upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from('club-logos').getPublicUrl(path).data.publicUrl
  }

  const value = useMemo(
    () => ({
      clubs,
      questions,
      applications,
      profiles,
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
      promoteStudentToLeader,
      markNotificationRead,
      uploadClubLogo,
    }),
    [clubs, questions, applications, profiles, favoriteClubIds, notifications, settings, loading, error],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData는 DataProvider 안에서 사용해야 합니다.')
  return context
}
