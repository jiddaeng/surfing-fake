import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, Search, UserRound, X, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import type { ClubApplication } from '../types'
import { Badge, Button, EmptyState, inputClass } from '../components/ui'
import { formatFullDate } from '../lib/utils'

export function LeaderApplicantsPage() {
  const { profile } = useAuth()
  const { clubs, applications, profiles, questions, setApplicationStatus, settings } = useData()
  const club = clubs.find((item) => item.leaderId === profile?.id)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<ClubApplication | null>(null)
  const [changing, setChanging] = useState(false)
  const filtered = useMemo(() => applications.filter((app) => app.clubId === club?.id && app.status !== 'draft').filter((app) => status === 'all' || app.status === status).filter((app) => {
    const student = profiles.find((item) => item.id === app.userId)
    return !query || `${student?.name} ${student?.studentNumber}`.includes(query)
  }), [applications, club?.id, status, query, profiles])

  if (!club) return <EmptyState title="동아리를 먼저 등록해주세요" description="지원자를 받으려면 동아리 정보와 질문을 먼저 설정해야 해요." />
  const student = selected ? profiles.find((item) => item.id === selected.userId) : null
  const clubQuestions = questions.filter((item) => item.clubId === club.id).sort((a, b) => a.order - b.order)

  const decide = async (next: 'reviewing' | 'accepted' | 'rejected') => {
    if (!selected) return
    setChanging(true)
    try { await setApplicationStatus(selected.id, next); setSelected({ ...selected, status: next }) } finally { setChanging(false) }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div><p className="text-sm font-bold text-brand-600">APPLICANT MANAGEMENT</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{club.name} 지원자</h1><p className="mt-2 text-sm text-gray-500">지원서를 검토하고 합격 여부를 결정하세요.</p></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">{[['전체 지원자', applications.filter((a) => a.clubId === club.id && a.status !== 'draft').length], ['검토 대기', applications.filter((a) => a.clubId === club.id && ['submitted','reviewing'].includes(a.status)).length], ['합격 예정', applications.filter((a) => a.clubId === club.id && a.status === 'accepted').length]].map(([label, value]) => <div key={label} className="card p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-black">{value}<span className="ml-1 text-xs font-medium text-gray-400">명</span></p></div>)}</div>
      <div className="card mt-5 p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-3.5 text-gray-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-10`} placeholder="이름 또는 학번 검색" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-36`}><option value="all">전체 상태</option><option value="submitted">제출 완료</option><option value="reviewing">검토 중</option><option value="accepted">합격</option><option value="rejected">불합격</option></select></div></div>
      {filtered.length ? <div className="card mt-4 overflow-hidden"><div className="divide-y divide-gray-100">{filtered.map((app) => {
        const applicant = profiles.find((item) => item.id === app.userId)
        return <button key={app.id} onClick={() => setSelected(app)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-gray-50 sm:p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{applicant?.name.slice(0, 1) ?? '?'}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{applicant?.name ?? '지원자'} <span className="ml-1 text-xs font-normal text-gray-400">{applicant?.studentNumber}</span></p><p className="mt-1 text-xs text-gray-400">{app.submittedAt ? formatFullDate(app.submittedAt) : ''}</p></div><Badge tone={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'blue'}>{app.status === 'submitted' ? '제출 완료' : app.status === 'reviewing' ? '검토 중' : app.status === 'accepted' ? '합격' : '불합격'}</Badge><ChevronRight size={17} className="hidden text-gray-300 sm:block" /></button>
      })}</div></div> : <div className="mt-4"><EmptyState title="조건에 맞는 지원자가 없어요" description="검색어나 상태 필터를 변경해보세요." /></div>}

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><UserRound size={20} /></div><div><h2 className="font-black">{student?.name ?? '지원자'}</h2><p className="text-xs text-gray-500">{student?.studentNumber} · {student?.email}</p></div></div><button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"><X size={20} /></button></div><div className="space-y-5 p-5 sm:p-7">{clubQuestions.map((question, index) => <div key={question.id}><p className="text-xs font-bold text-brand-600">질문 {index + 1}</p><h3 className="mt-1 text-sm font-bold leading-6">{question.label}</h3><div className="mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-700">{Array.isArray(selected.answers[question.id]) ? (selected.answers[question.id] as string[]).join(', ') : selected.answers[question.id] || <span className="text-gray-400">답변 없음</span>}</div></div>)}</div><div className="sticky bottom-0 border-t border-gray-100 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-[11px] leading-5 text-gray-500">학생에게는 {settings ? formatFullDate(settings.resultAnnouncementAt) : '발표일'} 이후 공개됩니다.</p><Badge tone={selected.status === 'accepted' ? 'green' : selected.status === 'rejected' ? 'red' : 'blue'}>현재: {selected.status === 'accepted' ? '합격' : selected.status === 'rejected' ? '불합격' : selected.status === 'reviewing' ? '검토 중' : '제출 완료'}</Badge></div><div className="grid grid-cols-3 gap-2"><Button variant={selected.status === 'reviewing' ? 'primary' : 'secondary'} loading={changing} onClick={() => decide('reviewing')}>검토 중</Button><Button variant={selected.status === 'rejected' ? 'danger' : 'secondary'} loading={changing} onClick={() => decide('rejected')}><XCircle size={16} /> 불합격</Button><Button variant={selected.status === 'accepted' ? 'primary' : 'secondary'} loading={changing} onClick={() => decide('accepted')} className={selected.status === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}><CheckCircle2 size={16} /> 합격</Button></div></div></div></div>}
    </div>
  )
}
