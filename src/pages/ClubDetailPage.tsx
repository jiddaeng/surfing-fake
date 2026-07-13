import { ArrowLeft, CalendarClock, Heart, UserRound, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Badge, Button, EmptyState } from '../components/ui'
import { ClubLogo } from '../components/ClubLogo'
import { daysUntil, formatFullDate, isRecruiting } from '../lib/utils'

export function ClubDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { clubs, applications, favoriteClubIds, toggleFavorite, settings } = useData()
  const club = clubs.find((item) => item.id === id)
  if (!club) return <EmptyState title="동아리를 찾을 수 없어요" description="삭제되었거나 공개되지 않은 동아리입니다." action={<Link to="/clubs"><Button variant="secondary">목록으로</Button></Link>} />

  const existing = applications.find((app) => app.clubId === club.id && app.userId === profile?.id)
  const recruiting = settings && isRecruiting(settings.recruitmentStartAt, settings.recruitmentEndAt)
  const submittedCount = applications.filter((app) => app.userId === profile?.id && app.status !== 'draft').length
  const canApply = profile?.role === 'student' && recruiting && (!existing || existing.status === 'draft') && (existing || !settings || submittedCount < settings.maxApplications)

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/clubs" className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={17} /> 동아리 목록</Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="min-w-0">
          <section className="card overflow-hidden">
            <div className="h-2" style={{ backgroundColor: club.color }} />
            <div className="p-5 sm:p-8">
              <div className="flex items-start gap-4 sm:gap-5"><ClubLogo club={club} size="lg" /><div className="min-w-0 flex-1"><Badge tone="blue">{club.category}</Badge><h1 className="mt-2 truncate text-2xl font-black tracking-tight sm:text-3xl">{club.name}</h1><p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">{club.summary}</p></div>{profile?.role === 'student' && <button onClick={() => toggleFavorite(club.id)} className={`focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${favoriteClubIds.includes(club.id) ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}><Heart size={20} fill={favoriteClubIds.includes(club.id) ? 'currentColor' : 'none'} /></button>}</div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-gray-100 pt-5 text-sm text-gray-500"><span className="flex items-center gap-2"><UserRound size={17} className="text-gray-400" /> 동아리장 <strong className="text-gray-800">{club.leaderName}</strong></span><span className="flex items-center gap-2"><Users size={17} className="text-gray-400" /> 모집 인원 <strong className="text-gray-800">{club.capacity}명</strong></span></div>
            </div>
          </section>

          <section className="card mt-5 p-5 sm:p-8"><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{club.description}</ReactMarkdown></div></section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            {settings && <><div className="flex items-center gap-2 text-sm font-bold text-gray-800"><CalendarClock size={18} className="text-brand-600" /> 지원 안내</div><div className="mt-4 rounded-2xl bg-brand-50 p-4"><p className="text-xs font-semibold text-brand-700">모집 마감까지</p><p className="mt-1 text-3xl font-black text-brand-700">D-{daysUntil(settings.recruitmentEndAt)}</p><p className="mt-2 text-xs leading-5 text-brand-700/70">{formatFullDate(settings.recruitmentEndAt)}</p></div></>}
            <div className="mt-4">
              {!profile ? <Link to="/login"><Button className="w-full" size="lg">로그인하고 지원하기</Button></Link>
                : profile.role !== 'student' ? <Button className="w-full" disabled size="lg">학생 계정만 지원 가능</Button>
                : existing && existing.status !== 'draft' ? <Link to="/applications"><Button className="w-full" variant="secondary" size="lg">지원 현황 보기</Button></Link>
                : canApply ? <Link to={`/clubs/${club.id}/apply`}><Button className="w-full" size="lg">{existing ? '작성 이어가기' : '지원서 작성하기'}</Button></Link>
                : <Button className="w-full" disabled size="lg">지원할 수 없어요</Button>}
            </div>
            <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">제출한 지원서는 수정하거나 취소할 수 없습니다.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
