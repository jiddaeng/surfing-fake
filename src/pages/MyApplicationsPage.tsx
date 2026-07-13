import { CheckCircle2, Clock3, FileEdit, LockKeyhole, PartyPopper, XCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Badge, Button, EmptyState } from '../components/ui'
import { ClubLogo } from '../components/ClubLogo'
import { formatFullDate, isResultPublished } from '../lib/utils'
import { STATUS_LABEL } from '../types'

export function MyApplicationsPage() {
  const { profile } = useAuth()
  const { clubs, applications, settings } = useData()
  const location = useLocation()
  const mine = applications.filter((app) => app.userId === profile?.id)
  const resultPublished = settings ? isResultPublished(settings.resultAnnouncementAt) : false

  return (
    <div className="mx-auto max-w-5xl">
      {location.state?.submitted && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 size={20} className="shrink-0" /><div><p className="text-sm font-bold">{location.state.submitted} 지원서가 제출됐어요!</p><p className="mt-1 text-xs">합격 발표 전까지 현재 페이지에서 진행 상태를 확인할 수 있어요.</p></div></div>}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-brand-600">MY APPLICATIONS</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">내 지원 현황</h1><p className="mt-2 text-sm text-gray-500">작성한 지원서와 결과를 한눈에 확인하세요.</p></div>{settings && <div className="rounded-xl bg-violet-50 px-4 py-3"><p className="text-[11px] font-semibold text-violet-600">합격 발표</p><p className="mt-0.5 text-xs font-bold text-violet-900">{formatFullDate(settings.resultAnnouncementAt)}</p></div>}</div>

      {!resultPublished && mine.some((app) => ['accepted', 'rejected'].includes(app.status)) && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="text-sm font-bold text-brand-900">지원 결과는 발표 시간에 공개돼요</p><p className="mt-1 text-xs leading-5 text-brand-700">동아리에서 결과 입력을 마쳐도 모든 학생에게 같은 시각에 공개됩니다.</p></div></div>}

      {mine.length ? <div className="mt-6 space-y-4">{mine.map((app) => {
        const club = clubs.find((item) => item.id === app.clubId)
        if (!club) return null
        const status = !resultPublished && ['accepted', 'rejected'].includes(app.status) ? 'reviewing' : app.status
        const icon = status === 'accepted' ? PartyPopper : status === 'rejected' ? XCircle : status === 'draft' ? FileEdit : Clock3
        const Icon = icon
        return <article key={app.id} className={`card overflow-hidden ${status === 'accepted' ? 'border-emerald-200' : ''}`}><div className={`h-1.5 ${status === 'accepted' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-gray-300' : 'bg-brand-500'}`} /><div className="p-5 sm:p-6"><div className="flex items-start gap-4"><ClubLogo club={club} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black">{club.name}</h2><Badge tone={status === 'accepted' ? 'green' : status === 'rejected' ? 'red' : status === 'draft' ? 'orange' : 'blue'}>{STATUS_LABEL[status]}</Badge></div><p className="mt-1 text-xs text-gray-500">{app.status === 'draft' ? `마지막 저장 ${formatFullDate(app.updatedAt)}` : `제출 ${app.submittedAt ? formatFullDate(app.submittedAt) : ''}`}</p></div><div className={`hidden h-11 w-11 items-center justify-center rounded-2xl sm:flex ${status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600'}`}><Icon size={21} /></div></div>
          {status === 'accepted' && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><strong>축하합니다! {club.name}에 합격했어요 🎉</strong><p className="mt-1 text-xs">자세한 활동 안내는 동아리장에게 전달받을 수 있어요.</p></div>}
          {status === 'rejected' && <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700"><strong>아쉽게도 이번에는 함께하지 못하게 되었어요.</strong><p className="mt-1 text-xs text-gray-500">지원해주셔서 감사하며, 다른 멋진 동아리도 살펴보세요.</p></div>}
          <div className="mt-5 flex justify-end">{status === 'draft' ? <Link to={`/clubs/${club.id}/apply`}><Button size="sm"><FileEdit size={15} /> 작성 이어가기</Button></Link> : <Link to={`/clubs/${club.id}`}><Button size="sm" variant="secondary">동아리 소개 보기</Button></Link>}</div></div></article>
      })}</div> : <div className="mt-6"><EmptyState title="아직 지원 내역이 없어요" description="최대 3개의 동아리에 지원할 수 있어요. 관심 있는 동아리를 찾아보세요." action={<Link to="/clubs"><Button>동아리 둘러보기</Button></Link>} /></div>}
    </div>
  )
}
