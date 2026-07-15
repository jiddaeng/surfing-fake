import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Building2, CalendarClock, CheckCircle2, RefreshCcw, Save, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { RecruitmentSettings } from '../types'
import { ROLE_LABEL } from '../types'
import { Badge, Button, inputClass } from '../components/ui'
import { formatFullDate, toDateTimeLocal } from '../lib/utils'
import { isDemoMode } from '../lib/supabase'

export function AdminDashboard() {
  const { clubs, applications, profiles, pendingAccounts, accountApprovalReady, settings, updateSettings, syncOfficialClubCatalog, approveAccount, promoteStudentToLeader } = useData()
  const [schedule, setSchedule] = useState<RecruitmentSettings | null>(settings)
  const [saving, setSaving] = useState(false)
  const [promotingId, setPromotingId] = useState('')
  const [message, setMessage] = useState('')
  const [roleMessage, setRoleMessage] = useState('')
  const [approvingId, setApprovingId] = useState('')
  const [approvalMessage, setApprovalMessage] = useState('')
  const [catalogSyncing, setCatalogSyncing] = useState(false)
  const [catalogMessage, setCatalogMessage] = useState('')
  useEffect(() => setSchedule(settings), [settings])

  const submitted = applications.filter((app) => app.status !== 'draft')
  const accepted = applications.filter((app) => app.status === 'accepted')
  const stats = [
    [Users, '전체 사용자', profiles.length, 'bg-brand-50 text-brand-600'],
    [Building2, '등록 동아리', clubs.length, 'bg-violet-50 text-violet-600'],
    [BarChart3, '제출 지원서', submitted.length, 'bg-orange-50 text-orange-600'],
    [CheckCircle2, '합격 예정', accepted.length, 'bg-emerald-50 text-emerald-600'],
  ] as const
  const clubStats = useMemo(() => clubs.map((club) => ({ club, count: submitted.filter((app) => app.clubId === club.id).length })).sort((a, b) => b.count - a.count), [clubs, submitted])
  const maxCount = Math.max(1, ...clubStats.map((item) => item.count))
  const students = useMemo(() => profiles.filter((item) => item.role === 'student').sort((a, b) => a.name.localeCompare(b.name, 'ko')), [profiles])

  const saveSchedule = async () => {
    if (!schedule) return
    if (new Date(schedule.recruitmentStartAt) >= new Date(schedule.recruitmentEndAt) || new Date(schedule.recruitmentEndAt) > new Date(schedule.resultAnnouncementAt)) { setMessage('모집 시작, 마감, 발표일 순서를 확인해주세요.'); return }
    setSaving(true); setMessage('')
    try { await updateSettings(schedule); setMessage('모집 일정을 저장했어요.') }
    catch (error) { setMessage(error instanceof Error ? error.message : '일정을 저장하지 못했습니다.') }
    finally { setSaving(false) }
  }

  const promote = async (profileId: string) => {
    const target = profiles.find((item) => item.id === profileId)
    if (!target) return
    setPromotingId(profileId); setRoleMessage('')
    try {
      await promoteStudentToLeader(profileId)
      setRoleMessage(`${target.name} 계정을 동아리장으로 승급했어요.`)
    } catch (error) {
      setRoleMessage(error instanceof Error ? error.message : '계정 역할을 변경하지 못했습니다.')
    } finally {
      setPromotingId('')
    }
  }

  const approve = async (userId: string) => {
    const target = pendingAccounts.find((item) => item.id === userId)
    if (!target) return
    setApprovingId(userId); setApprovalMessage('')
    try {
      await approveAccount(userId)
      setApprovalMessage(`${target.name} 계정을 승인했어요. 이제 학번으로 로그인할 수 있습니다.`)
    } catch (error) {
      setApprovalMessage(error instanceof Error ? error.message : '계정을 승인하지 못했습니다.')
    } finally {
      setApprovingId('')
    }
  }

  const syncCatalog = async () => {
    setCatalogSyncing(true); setCatalogMessage('')
    try {
      await syncOfficialClubCatalog()
      setCatalogMessage('공식 동아리 13개를 Supabase에 적용했어요.')
    } catch (error) {
      setCatalogMessage(error instanceof Error ? error.message : '공식 동아리 목록을 적용하지 못했습니다.')
    } finally {
      setCatalogSyncing(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div><p className="text-sm font-bold text-brand-600">ADMIN CONSOLE</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">전체 모집 현황</h1><p className="mt-2 text-sm text-gray-500">동아리 모집 일정과 서비스 이용 현황을 관리하세요.</p></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([Icon, label, value, color]) => <div key={label} className="card flex items-center gap-4 p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={21} /></div><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div></div>)}</div>

      <section className="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="font-black">공식 동아리 목록</h2><p className="mt-1 text-sm text-gray-500">전달받은 13개 동아리를 적용하고 예전 시연 동아리를 비공개 처리합니다.</p>{catalogMessage && <p className={`mt-2 text-xs font-semibold ${catalogMessage.includes('적용했') ? 'text-emerald-700' : 'text-red-700'}`}>{catalogMessage}</p>}</div>
        <Button onClick={syncCatalog} loading={catalogSyncing} className="shrink-0"><RefreshCcw size={16} /> 공식 목록 적용</Button>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="card p-5 sm:p-6"><div className="flex items-center gap-2"><BarChart3 size={19} className="text-brand-600" /><h2 className="font-black">동아리별 지원 현황</h2></div><div className="mt-6 space-y-4">{clubStats.length ? clubStats.slice(0, 8).map(({ club, count }) => <div key={club.id}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-bold text-gray-700">{club.name}</span><span className="text-gray-500">{count}명</span></div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(count ? 8 : 0, count / maxCount * 100)}%`, backgroundColor: club.color }} /></div></div>) : <p className="py-10 text-center text-sm text-gray-500">등록된 동아리가 없어요.</p>}</div></section>

        <section className="card p-5 sm:p-6"><div className="flex items-center gap-2"><CalendarClock size={19} className="text-brand-600" /><h2 className="font-black">공통 모집 일정</h2></div>{schedule && <div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-gray-600">모집 시작</span><input type="datetime-local" value={toDateTimeLocal(schedule.recruitmentStartAt)} onChange={(e) => setSchedule({ ...schedule, recruitmentStartAt: new Date(e.target.value).toISOString() })} className={inputClass} /></label><label className="block"><span className="mb-2 block text-xs font-bold text-gray-600">모집 마감</span><input type="datetime-local" value={toDateTimeLocal(schedule.recruitmentEndAt)} onChange={(e) => setSchedule({ ...schedule, recruitmentEndAt: new Date(e.target.value).toISOString() })} className={inputClass} /></label><label className="block"><span className="mb-2 block text-xs font-bold text-gray-600">합격 발표</span><input type="datetime-local" value={toDateTimeLocal(schedule.resultAnnouncementAt)} onChange={(e) => setSchedule({ ...schedule, resultAnnouncementAt: new Date(e.target.value).toISOString() })} className={inputClass} /></label><label className="block"><span className="mb-2 block text-xs font-bold text-gray-600">학생별 최대 지원 수</span><input type="number" min={1} max={10} value={schedule.maxApplications} onChange={(e) => setSchedule({ ...schedule, maxApplications: Number(e.target.value) })} className={inputClass} /></label>{message && <p className={`rounded-xl px-3 py-2 text-xs font-medium ${message.includes('저장했') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message}</p>}<Button onClick={saveSchedule} loading={saving} className="w-full"><Save size={16} /> 일정 저장</Button></div>}</section>
      </div>

      <section className="mt-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black"><UserCheck size={20} className="text-brand-600" /> 계정 승인</h2>
            <p className="mt-1 text-sm text-gray-500">회원가입을 요청한 학생을 확인하고 로그인을 허용합니다.</p>
          </div>
          <Badge tone={pendingAccounts.length ? 'red' : 'green'}>승인 대기 {pendingAccounts.length}명</Badge>
        </div>
        {approvalMessage && <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${approvalMessage.includes('승인했') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{approvalMessage}</p>}
        {isDemoMode ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">현재 시연 관리자로 로그인되어 있어 실제 가입 계정은 표시되지 않습니다. 실제 Supabase 관리자 계정으로 로그인하면 승인 대기 목록이 나타납니다.</p>
        ) : !accountApprovalReady ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800">계정 승인용 데이터베이스 기능이 아직 설치되지 않았습니다. 최신 Supabase 마이그레이션을 한 번 적용해주세요.</p>
        ) : (
          <div className="card mt-3 overflow-hidden">
            {pendingAccounts.length ? pendingAccounts.map((account) => (
              <div key={account.id} className="flex flex-col gap-3 border-b border-gray-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-gray-800">{account.name}</strong>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">학번 {account.studentNumber ?? '미설정'} · {formatFullDate(account.requestedAt)}</span>
                </div>
                <Button size="sm" onClick={() => approve(account.id)} loading={approvingId === account.id}>
                  <UserCheck size={15} /> 계정 승인
                </Button>
              </div>
            )) : <p className="px-5 py-12 text-center text-sm text-gray-500">승인을 기다리는 계정이 없어요.</p>}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-black">계정 역할 관리</h2>
            <p className="mt-1 text-sm text-gray-500">학생 계정을 동아리장으로 승급해 새 동아리 등록 권한을 부여합니다.</p>
          </div>
          <Badge tone="blue">학생 {students.length}명</Badge>
        </div>
        {roleMessage && <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${roleMessage.includes('승급했') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{roleMessage}</p>}
        <div className="card mt-3 overflow-hidden">
          {students.length ? students.map((student) => (
            <div key={student.id} className="flex flex-col gap-3 border-b border-gray-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-gray-800">{student.name}</strong>
                <span className="mt-0.5 block truncate text-xs text-gray-500">학번 {student.studentNumber ?? '미설정'}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => promote(student.id)} loading={promotingId === student.id}>
                <ShieldCheck size={15} /> 동아리장으로 승급
              </Button>
            </div>
          )) : <p className="px-5 py-12 text-center text-sm text-gray-500">승급할 학생 계정이 없어요.</p>}
        </div>
      </section>

      <section className="mt-8"><div className="flex items-center justify-between"><h2 className="text-lg font-black">사용자 및 지원 현황</h2><p className="text-xs text-gray-500">지원서 답변 내용은 동아리장만 볼 수 있어요.</p></div><div className="card mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500"><tr><th className="px-5 py-3 font-semibold">사용자</th><th className="px-5 py-3 font-semibold">역할</th><th className="px-5 py-3 font-semibold">지원 동아리</th><th className="px-5 py-3 font-semibold">상태</th><th className="px-5 py-3 font-semibold">제출 시각</th></tr></thead><tbody className="divide-y divide-gray-100">{submitted.map((app) => {
        const user = profiles.find((item) => item.id === app.userId); const club = clubs.find((item) => item.id === app.clubId)
        return <tr key={app.id} className="text-sm"><td className="px-5 py-4"><strong className="block text-gray-800">{user?.name ?? '사용자'}</strong><span className="text-xs text-gray-400">{user?.studentNumber ? `학번 ${user.studentNumber}` : `ID: ${user?.email.split('@')[0] ?? '-'}`}</span></td><td className="px-5 py-4"><Badge tone="gray">{user ? ROLE_LABEL[user.role] : '-'}</Badge></td><td className="px-5 py-4 font-medium">{club?.name ?? '-'}</td><td className="px-5 py-4"><Badge tone={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'blue'}>{app.status === 'submitted' ? '제출 완료' : app.status === 'reviewing' ? '검토 중' : app.status === 'accepted' ? '합격' : '불합격'}</Badge></td><td className="px-5 py-4 text-xs text-gray-500">{app.submittedAt ? formatFullDate(app.submittedAt) : '-'}</td></tr>
      })}{submitted.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">제출된 지원서가 없어요.</td></tr>}</tbody></table></div></section>
    </div>
  )
}
