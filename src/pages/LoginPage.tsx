import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from '../components/Layout'
import { Button, inputClass } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { isDemoMode } from '../lib/supabase'

const demoAccounts = [
  { role: '학생', email: 'student@dimigo.hs.kr', color: 'bg-brand-50 text-brand-700' },
  { role: '동아리장', email: 'leader@dimigo.hs.kr', color: 'bg-violet-50 text-violet-700' },
  { role: '신규 동아리장', email: 'newleader@dimigo.hs.kr', color: 'bg-sky-50 text-sky-700' },
  { role: '관리자', email: 'admin@dimigo.hs.kr', color: 'bg-gray-100 text-gray-700' },
]

export function LoginPage() {
  const { signIn, configured } = useAuth()
  const [email, setEmail] = useState(isDemoMode ? 'student@dimigo.hs.kr' : '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between"><Brand /><div className="flex items-center gap-1"><ThemeToggle /><Link to="/" className="flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> 홈으로</Link></div></div>
        <div className="card mt-8 rounded-[1.75rem] p-6 shadow-xl shadow-brand-100/60 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200"><LockKeyhole size={22} /></div>
          <h1 className="mt-5 text-2xl font-black tracking-tight">다시 만나서 반가워요</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">등록한 이메일과 비밀번호로 로그인하세요.</p>

          {!configured && <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-800">Supabase 환경변수가 아직 설정되지 않았습니다.</div>}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold">학교 이메일</span><div className="relative"><Mail size={17} className="absolute left-3.5 top-3.5 text-gray-400" /><input type="email" maxLength={320} required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-10`} placeholder="student@dimigo.hs.kr" autoComplete="username" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">비밀번호</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-3.5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} px-10`} placeholder="비밀번호 입력" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-3 top-3 text-gray-400" aria-label="비밀번호 표시 전환">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">로그인</Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">처음 이용하시나요? <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-700">학생 회원가입</Link></p>

          {isDemoMode && <><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-gray-200" /><span className="text-[11px] font-semibold text-gray-400">로컬 시연 계정 선택</span><span className="h-px flex-1 bg-gray-200" /></div>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button key={account.email} type="button" onClick={() => setEmail(account.email)} className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${email === account.email ? 'border-brand-300 bg-brand-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <span><strong className="block text-sm">{account.role} 계정</strong><span className="mt-0.5 block text-xs text-gray-500">{account.email}</span></span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${account.color}`}>{account.role}</span>
              </button>
            ))}
          </div></>}
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-[11px] leading-5 text-gray-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" /> 계정과 지원서는 Supabase의 역할별 보안 정책으로 보호됩니다.</p>
        </div>
      </div>
    </div>
  )
}
