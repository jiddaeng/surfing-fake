import type { Club } from '../types'
import { isTrustedClubLogoUrl } from '../lib/supabase'

export function ClubLogo({ club, size = 'md' }: { club: Club; size?: 'sm' | 'md' | 'lg' }) {
  const dimension = size === 'sm' ? 'h-10 w-10 rounded-xl text-sm' : size === 'lg' ? 'h-20 w-20 rounded-3xl text-2xl' : 'h-14 w-14 rounded-2xl text-lg'
  if (isTrustedClubLogoUrl(club.logoUrl)) return <img src={club.logoUrl} alt={`${club.name} 로고`} className={`${dimension} shrink-0 object-cover shadow-sm`} />
  return (
    <div
      className={`${dimension} flex shrink-0 items-center justify-center font-extrabold text-white shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${club.color}, ${club.color}bb)` }}
      aria-hidden="true"
    >
      {club.name.slice(0, 1)}
    </div>
  )
}
