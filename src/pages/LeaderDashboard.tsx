import { ArrowRight, CheckCircle2, Clock3, Settings2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Badge, Button, EmptyState } from '../components/ui'
import { ClubLogo } from '../components/ClubLogo'
import { daysUntil, formatFullDate } from '../lib/utils'

export function LeaderDashboard() {
  const { profile } = useAuth()
  const { clubs, applications, profiles, settings } = useData()
  const club = clubs.find((item) => item.leaderId === profile?.id)
  if (!club) return <div className="mx-auto max-w-3xl"><EmptyState title="아직 등록한 동아리가 없어요" description="동아리 기본 정보와 지원 질문을 등록하면 바로 모집을 시작할 수 있어요." action={<Link to="/leader/club"><Button>동아리 등록하기</Button></Link>} /></div>
  const applicants = applications.filter((app) => app.clubId === club.id && app.status !== 'draft')
  const reviewed = applicants.filter((app) => ['accepted', 'rejected'].includes(app.status)).length
  const accepted = applicants.filter((app) => app.status === 'accepted').length
  const fillRate = Math.min(100, Math.round((accepted / club.capacity) * 100))

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-brand-600">CLUB MANAGEMENT</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{profile?.name} 동아리장님, 안녕하세요 👋</h1></div><Link to="/leader/club"><Button variant="secondary"><Settings2 size={17} /> 동아리 정보 수정</Button></Link></div>

      <section className="card relative mt-7 overflow-hidden p-6 sm:p-8"><div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: club.color }} /><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><ClubLogo club={club} size="lg" /><div className="min-w-0 flex-1"><Badge tone="blue">{club.category}</Badge><h2 className="mt-2 text-2xl font-black">{club.name}</h2><p className="mt-1 text-sm text-gray-500">{club.summary}</p></div>{settings && <div className="rounded-2xl bg-brand-50 px-5 py-4 text-center"><p className="text-xs font-semibold text-brand-700">모집 마감</p><p className="mt-1 text-2xl font-black text-brand-700">D-{daysUntil(settings.recruitmentEndAt)}</p></div>}</div></section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Users, '전체 지원자', `${applicants.length}명`, 'bg-brand-50 text-brand-600'],
          [Clock3, '검토 대기', `${applicants.length - reviewed}명`, 'bg-orange-50 text-orange-600'],
          [CheckCircle2, '합격 예정', `${accepted}명`, 'bg-emerald-50 text-emerald-600'],
          [Users, '모집 충원율', `${fillRate}%`, 'bg-violet-50 text-violet-600'],
        ].map(([Icon, label, value, color]: any) => <div key={label} className="card flex items-center gap-4 p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={20} /></div><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div></div>)}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <section><div className="flex items-center justify-between"><h2 className="text-lg font-black">최근 지원자</h2><Link to="/leader/applicants" className="flex items-center gap-1 text-sm font-bold text-brand-600">전체보기 <ArrowRight size={15} /></Link></div><div className="card mt-3 divide-y divide-gray-100 overflow-hidden">{applicants.length ? applicants.slice(0, 5).map((app) => {
          const applicant = profiles.find((item) => item.id === app.userId)
          return <Link to="/leader/applicants" key={app.id} className="flex items-center gap-3 p-4 hover:bg-gray-50"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold">{applicant?.name.slice(0, 1) ?? '?'}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{applicant?.name ?? '지원자'}</p><p className="mt-0.5 text-xs text-gray-400">{applicant?.studentNumber ?? '학번 미설정'} · {app.submittedAt ? formatFullDate(app.submittedAt) : ''}</p></div><Badge tone={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'blue'}>{app.status === 'submitted' ? '제출 완료' : app.status === 'reviewing' ? '검토 중' : app.status === 'accepted' ? '합격' : '불합격'}</Badge></Link>
        }) : <p className="p-10 text-center text-sm text-gray-500">아직 제출된 지원서가 없어요.</p>}</div></section>
        <section><h2 className="text-lg font-black">모집 일정</h2><div className="card mt-3 space-y-5 p-5">{settings && <><Timeline label="모집 시작" value={formatFullDate(settings.recruitmentStartAt)} done /><Timeline label="모집 마감" value={formatFullDate(settings.recruitmentEndAt)} active /><Timeline label="합격 발표" value={formatFullDate(settings.resultAnnouncementAt)} /></>}</div></section>
      </div>
    </div>
  )
}

function Timeline({ label, value, done, active }: { label: string; value: string; done?: boolean; active?: boolean }) {
  return <div className="flex gap-3"><span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ${done ? 'bg-emerald-500 ring-emerald-50' : active ? 'bg-brand-500 ring-brand-50' : 'bg-gray-300 ring-gray-100'}`} /><div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs leading-5 text-gray-500">{value}</p></div></div>
}
