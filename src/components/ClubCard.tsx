import { ArrowUpRight, Heart, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Club } from '../types'
import { Badge } from './ui'
import { ClubLogo } from './ClubLogo'

export function ClubCard({ club, favorite, onFavorite }: { club: Club; favorite?: boolean; onFavorite?: () => void }) {
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/60">
      <div className="flex items-start justify-between gap-3">
        <ClubLogo club={club} />
        {onFavorite && (
          <button
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onFavorite()
            }}
            className={`focus-ring relative z-10 flex h-10 w-10 items-center justify-center rounded-xl transition ${favorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-500'}`}
            aria-label={favorite ? '찜 해제' : '찜하기'}
          >
            <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Badge tone="blue">{club.category}</Badge>
        <span className="flex items-center gap-1 text-xs font-medium text-gray-500"><Users size={13} /> {club.capacity}명</span>
      </div>
      <h3 className="mt-3 text-lg font-extrabold tracking-tight text-gray-950">{club.name}</h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-gray-500">{club.summary}</p>
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-500">동아리장 {club.leaderName}</span>
        <Link to={`/clubs/${club.id}`} className="flex items-center gap-1 text-sm font-bold text-brand-600 after:absolute after:inset-0">
          자세히 <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  )
}
