import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'
import { isDemoMode, isSupabaseConfigured, supabase } from '../lib/supabase'
import { readDemoAccounts, saveDemoAccount } from '../data/demo'

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  configured: boolean
  signIn: (loginId: string, password: string) => Promise<void>
  signUp: (name: string, studentNumber: string, password: string) => Promise<{ requiresApproval: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const demoSessionKey = 'surfing-fake:demo-session'
const toInternalEmail = (loginId: string) => {
  const normalized = loginId.trim().toLowerCase()
  return normalized.includes('@') ? normalized : `${normalized}@dimigo.hs.kr`
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
      const account = readDemoAccounts().find((item) => item.id === id)
      if (!account) {
        setProfile(null)
        return
      }
      const { password: _password, ...nextProfile } = account
      void _password
      setProfile(nextProfile)
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

  const signIn = async (loginId: string, password: string) => {
    const email = toInternalEmail(loginId)
    if (isDemoMode) {
      const account = readDemoAccounts().find((item) => item.email.toLowerCase() === email && item.password === password)
      if (!account) throw new Error('로그인 ID 또는 비밀번호를 확인해주세요.')
      localStorage.setItem(demoSessionKey, account.id)
      const { password: _password, ...nextProfile } = account
      void _password
      setProfile(nextProfile)
      return
    }
    if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) throw new Error('아직 승인되지 않은 계정입니다. 관리자에게 문의해주세요.')
      throw new Error('로그인 ID 또는 비밀번호를 확인해주세요.')
    }
    await loadProfile(data.user.id)
  }

  const signUp = async (name: string, studentNumber: string, password: string) => {
    const email = toInternalEmail(studentNumber)
    if (isDemoMode) {
      if (readDemoAccounts().some((item) => item.email.toLowerCase() === email)) throw new Error('이미 가입된 학번입니다.')
      const account = {
        id: crypto.randomUUID(),
        email,
        password,
        name: name.trim(),
        studentNumber: studentNumber.trim(),
        role: 'student' as const,
        isActive: true,
      }
      saveDemoAccount(account)
      localStorage.setItem(demoSessionKey, account.id)
      const { password: _password, ...nextProfile } = account
      void _password
      setProfile(nextProfile)
      return { requiresApproval: false }
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
      if (error.message.toLowerCase().includes('already registered')) throw new Error('이미 가입된 학번입니다.')
      if (error.message.toLowerCase().includes('password')) throw new Error('비밀번호가 보안 기준을 충족하지 않습니다.')
      throw new Error(error.message || '회원가입하지 못했습니다.')
    }
    if (data.session && data.user) {
      await new Promise((resolve) => window.setTimeout(resolve, 150))
      await loadProfile(data.user.id)
    }
    return { requiresApproval: !data.session }
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return context
}
