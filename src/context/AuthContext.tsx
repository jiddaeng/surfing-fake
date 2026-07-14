import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'
import { isDemoMode, isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEMO_ACCOUNTS } from '../data/demo'

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, studentNumber: string, email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const demoSessionKey = 'surfing-fake:demo-session'
const demoAccountsKey = 'surfing-fake:demo-accounts'

const demoAccounts = () => {
  try {
    const custom = JSON.parse(localStorage.getItem(demoAccountsKey) || '[]')
    return [...DEMO_ACCOUNTS, ...(Array.isArray(custom) ? custom : [])]
  } catch {
    return DEMO_ACCOUNTS
  }
}

const mapProfile = (row: any): Profile => ({
  id: row.id,
  email: row.email,
  name: row.name,
  studentNumber: row.student_number ?? undefined,
  role: row.role,
  avatarUrl: row.avatar_url ?? undefined,
  isActive: row.is_active,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId?: string) => {
    if (isDemoMode) {
      const id = userId || localStorage.getItem(demoSessionKey)
      const account = demoAccounts().find((item) => item.id === id)
      setProfile(account ? { ...account, password: undefined } : null)
      return
    }
    if (!supabase) {
      setProfile(null)
      return
    }
    const id = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!id) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) throw new Error('프로필을 불러오지 못했습니다. Supabase 초기 SQL을 먼저 실행해주세요.')
    if (!data.is_active) {
      await supabase.auth.signOut()
      throw new Error('비활성화된 계정입니다. 관리자에게 문의해주세요.')
    }
    setProfile(mapProfile(data))
  }

  useEffect(() => {
    if (isDemoMode) {
      loadProfile().finally(() => setLoading(false))
      return
    }
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        if (data.session?.user) await loadProfile(data.session.user.id)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setProfile(null)
      if (event === 'SIGNED_IN' && session?.user) {
        window.setTimeout(() => loadProfile(session.user.id).catch(console.error), 0)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      const account = demoAccounts().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password)
      if (!account) throw new Error('이메일 또는 비밀번호를 확인해주세요.')
      localStorage.setItem(demoSessionKey, account.id)
      const { password: _password, ...nextProfile } = account
      void _password
      setProfile(nextProfile)
      return
    }
    if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('이메일 또는 비밀번호를 확인해주세요.')
    await loadProfile(data.user.id)
  }

  const signUp = async (name: string, studentNumber: string, email: string, password: string) => {
    if (isDemoMode) {
      const normalizedEmail = email.trim().toLowerCase()
      if (demoAccounts().some((item) => item.email.toLowerCase() === normalizedEmail)) throw new Error('이미 가입된 이메일입니다.')
      const account = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password,
        name: name.trim(),
        studentNumber: studentNumber.trim(),
        role: 'student' as const,
        isActive: true,
      }
      const custom = demoAccounts().filter((item) => !DEMO_ACCOUNTS.some((base) => base.id === item.id))
      localStorage.setItem(demoAccountsKey, JSON.stringify([...custom, account]))
      localStorage.setItem(demoSessionKey, account.id)
      const { password: _password, ...nextProfile } = account
      void _password
      setProfile(nextProfile)
      return { requiresEmailConfirmation: false }
    }
    if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          student_number: studentNumber.trim(),
        },
      },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) throw new Error('이미 가입된 이메일입니다.')
      if (error.message.toLowerCase().includes('password')) throw new Error('비밀번호가 보안 기준을 충족하지 않습니다.')
      throw new Error(error.message || '회원가입하지 못했습니다.')
    }
    if (data.session && data.user) {
      await new Promise((resolve) => window.setTimeout(resolve, 150))
      await loadProfile(data.user.id)
    }
    return { requiresEmailConfirmation: !data.session }
  }

  const signOut = async () => {
    if (isDemoMode) localStorage.removeItem(demoSessionKey)
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }

  const value: AuthContextValue = {
    profile,
    loading,
    configured: isDemoMode || isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    refreshProfile: () => loadProfile(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return context
}
