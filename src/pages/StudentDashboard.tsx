import { useMemo, useState } from 'react'
import { Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import { useData } from '../context/DataContext'
import { ClubCard } from '../components/ClubCard'
import { Button, EmptyState, inputClass } from '../components/ui'

export function StudentDashboard() {
  const { clubs, favoriteClubIds, toggleFavorite, loading } = useData()
  const [searchOpen, setSearchOpen] = useState(false)
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
      .sort((a, b) => sort === 'new'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : a.name.localeCompare(b.name, 'ko'))
  }, [clubs, query, category, favoritesOnly, favoriteClubIds, sort])

  const filtersActive = Boolean(query || category !== '전체' || favoritesOnly || sort !== 'name')

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-600">CLUB LIST</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">전체 동아리</h1>
          <p className="mt-2 text-sm text-gray-500">모집 중인 동아리를 확인하고 바로 지원해보세요.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-semibold text-gray-500 sm:block"><strong className="text-brand-600">{filtered.length}</strong>개</span>
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={`focus-ring relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${searchOpen ? 'border-brand-300 bg-brand-50 text-brand-600' : 'border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:text-brand-600'}`}
            aria-label={searchOpen ? '검색 닫기' : '동아리 검색'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
            {filtersActive && !searchOpen && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="card mt-5 p-4 sm:p-5">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-3.5 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${inputClass} pl-10`}
              placeholder="동아리 이름이나 활동 검색"
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${category === item ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant={favoritesOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setFavoritesOnly((only) => !only)}>
                <Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> 찜만 보기
              </Button>
              <label className="relative flex-1 sm:flex-none">
                <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-xs font-semibold text-gray-600 sm:w-28">
                  <option value="name">가나다순</option>
                  <option value="new">최근 등록순</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-gray-200" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              favorite={favoriteClubIds.includes(club.id)}
              onFavorite={() => toggleFavorite(club.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6"><EmptyState title="조건에 맞는 동아리가 없어요" description="검색어나 필터를 바꿔 다시 확인해보세요." /></div>
      )}
    </div>
  )
}
