import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from '../components/Layout'
import { Button, inputClass } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'

export function SignupPage() {
  const { signUp, configured } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', studentNumber: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name.trim()) return setError('이름을 입력해주세요.')
    if (!/^\d{4}$/.test(form.studentNumber)) return setError('학번은 숫자 4자리로 입력해주세요. 예: 1301')
    if (form.password.length < 10) return setError('비밀번호는 10자 이상이어야 합니다.')
    if (form.password !== form.confirmPassword) return setError('비밀번호 확인이 일치하지 않습니다.')
    if (!agreed) return setError('개인정보 수집 및 이용에 동의해주세요.')

    setLoading(true)
    try {
      const result = await signUp(form.name, form.studentNumber, form.password)
      if (result.requiresApproval) {
        setSuccess('계정이 생성됐습니다. 관리자 승인 후 학번으로 로그인할 수 있습니다.')
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '회원가입하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between"><Brand /><div className="flex items-center gap-1"><ThemeToggle /><Link to="/login" className="flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> 로그인</Link></div></div>
        <div className="card mt-8 rounded-[1.75rem] p-6 shadow-xl shadow-brand-100/60 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200"><UserRound size={23} /></div>
          <h1 className="mt-5 text-2xl font-black tracking-tight">SURFING 시작하기</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">학생 계정을 만들고 관심 있는 동아리를 찾아보세요.</p>
          {!configured && <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">Supabase 환경변수가 설정되지 않았습니다.</div>}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold">이름</span><input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="홍길동" maxLength={20} required /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">학번</span><input value={form.studentNumber} onChange={(e) => update('studentNumber', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputClass} placeholder="예: 1301" inputMode="numeric" maxLength={4} required /></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">비밀번호</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-3.5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} className={`${inputClass} px-10`} placeholder="10자 이상 입력" autoComplete="new-password" minLength={10} maxLength={128} required /><button type="button" onClick={() => setShowPassword((show) => !show)} className="absolute right-3 top-3 text-gray-400" aria-label="비밀번호 표시 전환">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">비밀번호 확인</span><input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className={inputClass} placeholder="비밀번호를 한 번 더 입력" autoComplete="new-password" required /></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-3.5 text-xs leading-5 text-gray-600"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-brand-600" /><span><strong className="text-gray-800">개인정보 수집 및 이용에 동의합니다.</strong><br />동아리 지원을 위해 이름, 학번, 로그인 ID를 저장합니다.</span></label>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}
            {success && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{success}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">학생 계정 만들기</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">이미 계정이 있나요? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">로그인</Link></p>
          <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">동아리장·관리자 계정은 학생회 IT부에서 별도로 지정합니다.</p>
        </div>
      </div>
    </div>
  )
}
