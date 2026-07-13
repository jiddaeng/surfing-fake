import { useMemo, useState } from 'react'
import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { ClubCard } from '../components/ClubCard'
import { Button, EmptyState, inputClass } from '../components/ui'

export function ClubsPage() {
  const { profile } = useAuth()
  const { clubs, favoriteClubIds, toggleFavorite, loading } = useData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('name')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const categories = ['전체', ...Array.from(new Set(clubs.map((club) => club.category)))]
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return clubs
      .filter((club) => !normalized || `${club.name} ${club.summary}`.toLowerCase().includes(normalized))
      .filter((club) => category === '전체' || club.category === category)
      .filter((club) => !favoritesOnly || favoriteClubIds.includes(club.id))
      .sort((a, b) => sort === 'new' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : a.name.localeCompare(b.name, 'ko'))
  }, [clubs, query, category, favoritesOnly, favoriteClubIds, sort])

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-brand-600">CLUB EXPLORER</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">어떤 동아리를 찾고 있나요?</h1><p className="mt-2 text-sm text-gray-500">관심사와 목표에 맞는 동아리를 발견해보세요.</p></div>
        <p className="text-sm font-semibold text-gray-500"><strong className="text-brand-600">{filtered.length}</strong>개의 동아리</p>
      </div>

      <div className="card mt-7 p-4 sm:p-5">
        <div className="relative"><Search size={19} className="absolute left-4 top-3.5 text-gray-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} h-12 pl-11`} placeholder="동아리 이름이나 활동을 검색해보세요" /></div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${category === item ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{item}</button>)}
          </div>
          <div className="flex gap-2">
            {profile?.role === 'student' && <Button variant={favoritesOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setFavoritesOnly((only) => !only)}><Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> 찜한 동아리</Button>}
            <label className="relative flex-1 sm:flex-none"><SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-3 text-gray-400" /><select value={sort} onChange={(e) => setSort(e.target.value)} className="focus-ring h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-xs font-semibold text-gray-600 sm:w-28"><option value="name">가나다순</option><option value="new">최근 등록순</option></select></label>
          </div>
        </div>
      </div>

      {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />)}</div>
        : filtered.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((club) => <ClubCard key={club.id} club={club} favorite={favoriteClubIds.includes(club.id)} onFavorite={profile?.role === 'student' ? () => toggleFavorite(club.id) : undefined} />)}</div>
        : <div className="mt-6"><EmptyState title="조건에 맞는 동아리가 없어요" description="검색어나 카테고리를 바꿔 다시 찾아보세요." /></div>}
    </div>
  )
}
