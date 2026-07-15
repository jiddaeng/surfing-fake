import { useState, type ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { ROLE_LABEL } from '../types'
import { classNames, formatDate } from '../lib/utils'
import { Badge, Button } from './ui'
import { ThemeToggle } from './ThemeToggle'

const roleNavigation = {
  student: [
    { to: '/dashboard', label: '홈', icon: Home },
    { to: '/applications', label: '내 지원', icon: ClipboardList },
  ],
  leader: [
    { to: '/leader', label: '운영 홈', icon: Home },
    { to: '/leader/club', label: '동아리 관리', icon: Settings2 },
    { to: '/leader/applicants', label: '지원자', icon: Users },
  ],
  admin: [
    { to: '/admin', label: '통계', icon: BarChart3 },
    { to: '/clubs', label: '동아리', icon: BookOpen },
  ],
}

export function Brand() {
  return (
    <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-xl">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black tracking-tighter text-white shadow-md shadow-brand-200">DC</span>
      <span className="leading-none">
        <strong className="block text-[15px] font-black tracking-tight text-gray-950">SURFING</strong>
        <span className="mt-1 block text-[10px] font-semibold tracking-widest text-gray-400">동아리 지원 서비스</span>
      </span>
    </Link>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const { error, notifications, markNotificationRead } = useData()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Brand />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/login"><Button size="sm">로그인</Button></Link>
            </div>
          </div>
        </header>
        {error && <ErrorBanner message={error} />}
        <main className="animate-fade-up mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>
      </div>
    )
  }

  const navigation = roleNavigation[profile.role]
  const unread = notifications.filter((item) => !item.read).length

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Brand />
            <nav className="hidden items-center gap-1 lg:flex">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => classNames('focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => { setNotificationOpen((open) => !open); setProfileOpen(false) }}
                className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                aria-label="알림"
              >
                <Bell size={20} />
                {unread > 0 && <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <strong className="text-sm">알림</strong>
                    {unread > 0 && <Badge tone="blue">새 알림 {unread}</Badge>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-gray-500">새로운 알림이 없어요.</div>
                    ) : notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => markNotificationRead(item.id)}
                        className={classNames('block w-full border-b border-gray-100 px-4 py-3.5 text-left last:border-0 hover:bg-gray-50', !item.read && 'bg-brand-50/60')}
                      >
                        <span className="flex items-start gap-3">
                          <span className={classNames('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-gray-200' : 'bg-brand-500')} />
                          <span>
                            <strong className="block text-sm text-gray-900">{item.title}</strong>
                            <span className="mt-1 block text-xs leading-5 text-gray-500">{item.message}</span>
                            <span className="mt-1.5 block text-[11px] text-gray-400">{formatDate(item.createdAt, true)}</span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button
                onClick={() => { setProfileOpen((open) => !open); setNotificationOpen(false) }}
                className="focus-ring flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-extrabold text-brand-700">{profile.name.slice(0, 1)}</span>
                <span className="hidden text-left md:block">
                  <span className="block text-xs font-bold text-gray-800">{profile.name}</span>
                  <span className="block text-[10px] text-gray-400">{ROLE_LABEL[profile.role]}</span>
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-gray-100 px-3 py-2.5">
                    <p className="text-sm font-bold">{profile.name}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{profile.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
                    <LogOut size={16} /> 로그아웃
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setMobileMenu((open) => !open)} className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="메뉴">
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 sm:hidden">
              <CircleUserRound className="text-brand-600" />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">{profile.name}</p><p className="truncate text-xs text-gray-500">{profile.email}</p></div>
              <Badge tone="blue">{ROLE_LABEL[profile.role]}</Badge>
            </div>
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMobileMenu(false)} className={({ isActive }) => classNames('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600')}>
                <item.icon size={18} /> {item.label}
              </NavLink>
            ))}
            <button onClick={handleSignOut} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 sm:hidden"><LogOut size={18} /> 로그아웃</button>
          </div>
        )}
      </header>

      {error && <ErrorBanner message={error} />}
      <main key={location.pathname} className="animate-fade-up mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => classNames('flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold', isActive ? 'text-brand-600' : 'text-gray-400')}>
              <item.icon size={20} strokeWidth={2.2} /> {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-800">
      <ShieldCheck size={14} className="mr-1.5 inline" /> {message}
    </div>
  )
}
