import { ArrowRight, CheckCircle2, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui'
import { ClubLogo } from '../components/ClubLogo'

export function LandingPage() {
  const { profile } = useAuth()
  const { clubs } = useData()
  if (profile) {
    const destination = profile.role === 'student' ? '/dashboard' : profile.role === 'leader' ? '/leader' : '/admin'
    return <div className="py-24 text-center"><Link to={destination}><Button>대시보드로 이동 <ArrowRight size={17} /></Button></Link></div>
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-200/35 blur-3xl" />
        <div className="absolute -left-20 top-72 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm"><Sparkles size={14} /> 2026 동아리 모집 진행 중</span>
            <h1 className="mt-6 text-4xl font-black leading-[1.18] tracking-[-0.045em] text-gray-950 sm:text-5xl lg:text-6xl">
              좋아하는 일을 찾는<br /><span className="text-brand-600">가장 쉬운 방법</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-gray-500 sm:text-lg sm:leading-8">디미고의 모든 동아리를 한곳에서 둘러보고, 나에게 맞는 동아리에 지원하세요. 임시 저장부터 결과 확인까지 놓치지 않게 도와드려요.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/clubs"><Button size="lg" className="w-full sm:w-auto">동아리 둘러보기 <ArrowRight size={18} /></Button></Link>
              <Link to="/login"><Button size="lg" variant="secondary" className="w-full sm:w-auto">시연 계정으로 로그인</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> 최대 3개 지원</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> 지원서 자동 저장</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> 결과 알림</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rotate-2 rounded-[2rem] bg-brand-200/40" />
            <div className="card relative overflow-hidden rounded-[1.75rem] p-4 shadow-2xl shadow-brand-200/40 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-gray-400"><Search size={18} /><span className="text-sm">관심 있는 동아리를 검색해보세요</span></div>
              <div className="mt-5 flex items-center justify-between"><strong className="text-sm">지금 주목받는 동아리</strong><span className="text-xs font-bold text-brand-600">전체보기</span></div>
              <div className="mt-3 space-y-2.5">
                {(clubs.length ? clubs.slice(0, 3) : [
                  { id: '1', name: '저스트', summary: '동아리 소개 준비 중', category: '전공', color: '#155eef' },
                  { id: '2', name: '루나', summary: '동아리 소개 준비 중', category: '전공', color: '#7c3aed' },
                  { id: '3', name: '임플루드', summary: '동아리 소개 준비 중', category: '전공', color: '#0e9384' },
                ] as any[]).map((club) => (
                  <div key={club.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    <ClubLogo club={{ ...club, logoUrl: undefined } as any} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{club.name}</p><p className="mt-0.5 text-xs text-gray-400">{club.summary}</p></div>
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">{club.category}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-600 p-4 text-white"><p className="text-xs text-brand-100">모집 마감까지</p><p className="mt-1 text-2xl font-black">D-7</p></div>
                <div className="rounded-2xl bg-gray-900 p-4 text-white"><p className="text-xs text-gray-400">등록 동아리</p><p className="mt-1 text-2xl font-black">{clubs.length || 9}<span className="ml-1 text-sm">개</span></p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center"><p className="text-sm font-bold text-brand-600">WHY DIMI CLUB</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">지원 과정은 간단하고, 정보는 안전하게</h2></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [Search, '한눈에 탐색', '카테고리와 이름으로 원하는 동아리를 빠르게 찾을 수 있어요.'],
            [Sparkles, '놓치지 않는 지원', '작성 중인 답변이 저장되고 마감일과 지원 현황을 한눈에 확인해요.'],
            [ShieldCheck, '역할별 안전한 관리', '학생, 동아리장, 관리자의 권한을 분리해 지원서를 안전하게 보호해요.'],
          ].map(([Icon, title, description]: any) => (
            <div key={title} className="card p-6 sm:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={21} /></div><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{description}</p></div>
          ))}
        </div>
      </section>
    </>
  )
}
