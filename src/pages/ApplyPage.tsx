import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, Cloud, Send } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import type { AnswerValue } from '../types'
import { Button, inputClass, textareaClass } from '../components/ui'
import { ClubLogo } from '../components/ClubLogo'

export function ApplyPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { clubs, questions, applications, saveDraft, submitApplication } = useData()
  const navigate = useNavigate()
  const club = clubs.find((item) => item.id === id)
  const clubQuestions = useMemo(() => questions.filter((question) => question.clubId === id).sort((a, b) => a.order - b.order), [questions, id])
  const existing = applications.find((app) => app.clubId === id && app.userId === profile?.id)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(existing?.answers ?? {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(Boolean(existing))
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!existing) return
    setAnswers(existing.answers)
  }, [existing?.id])

  if (!club || profile?.role !== 'student') return <div className="card mx-auto max-w-xl p-8 text-center"><AlertTriangle className="mx-auto text-amber-500" /><h1 className="mt-3 font-bold">지원서를 작성할 수 없어요</h1><Link to="/clubs" className="mt-5 inline-flex"><Button variant="secondary">동아리 목록</Button></Link></div>
  if (existing && existing.status !== 'draft') return <div className="card mx-auto max-w-xl p-8 text-center"><Check className="mx-auto text-emerald-500" /><h1 className="mt-3 font-bold">이미 제출한 지원서예요</h1><p className="mt-2 text-sm text-gray-500">제출한 지원서는 수정하거나 취소할 수 없습니다.</p><Link to="/applications" className="mt-5 inline-flex"><Button>지원 현황 보기</Button></Link></div>

  const change = (questionId: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setErrors((current) => ({ ...current, [questionId]: '' }))
    setSaved(false)
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    clubQuestions.forEach((question) => {
      const answer = answers[question.id]
      if (question.required && (!answer || (Array.isArray(answer) ? answer.length === 0 : !answer.trim()))) nextErrors[question.id] = '필수 질문에 답변해주세요.'
      if (question.type === 'link' && answer && typeof answer === 'string') {
        try { new URL(answer) } catch { nextErrors[question.id] = 'https://로 시작하는 올바른 주소를 입력해주세요.' }
      }
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    setSaving(true); setMessage('')
    try { await saveDraft(club.id, answers); setSaved(true); setMessage('지원서가 안전하게 임시 저장됐어요.') }
    catch (error) { setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.') }
    finally { setSaving(false) }
  }

  const handleSubmit = async () => {
    if (!validate()) { document.querySelector('[data-question-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (!window.confirm('제출한 지원서는 수정하거나 취소할 수 없습니다. 정말 제출할까요?')) return
    setSubmitting(true); setMessage('')
    try { await submitApplication(club.id, answers); navigate('/applications', { state: { submitted: club.name } }) }
    catch (error) { setMessage(error instanceof Error ? error.message : '제출하지 못했습니다.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/clubs/${club.id}`} className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-gray-500"><ArrowLeft size={17} /> 동아리 소개로</Link>
      <div className="card mt-5 overflow-hidden"><div className="h-2" style={{ backgroundColor: club.color }} /><div className="flex items-center gap-4 p-5 sm:p-7"><ClubLogo club={club} /><div><p className="text-xs font-bold text-brand-600">동아리 지원서</p><h1 className="mt-1 text-xl font-black sm:text-2xl">{club.name}</h1><p className="mt-1 text-sm text-gray-500">총 {clubQuestions.length}개 질문 · <span className="text-brand-600">임시 저장 지원</span></p></div></div></div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong className="flex items-center gap-2"><AlertTriangle size={17} /> 제출 전 꼭 확인하세요</strong><p className="mt-1 text-xs text-amber-800">제출 후에는 지원서를 수정하거나 취소할 수 없습니다. 답변을 충분히 검토해주세요.</p></div>

      <div className="mt-5 space-y-4">
        {clubQuestions.map((question, index) => (
          <section key={question.id} className="card p-5 sm:p-7" data-question-error={Boolean(errors[question.id])}>
            <div className="mb-5 flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">{index + 1}</span><div><h2 className="text-sm font-bold leading-6">{question.label} {question.required && <span className="text-brand-600">*</span>}</h2>{question.description && <p className="mt-1 text-xs leading-5 text-gray-500">{question.description}</p>}</div></div>
            <QuestionInput question={question} value={answers[question.id]} onChange={(value) => change(question.id, value)} />
            {errors[question.id] && <p className="mt-2 text-xs font-medium text-red-600">{errors[question.id]}</p>}
          </section>
        ))}
      </div>

      {message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${message.includes('안전하게') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message}</p>}
      <div className="sticky bottom-20 z-20 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur lg:bottom-4"><span className="hidden items-center gap-2 pl-2 text-xs text-gray-500 sm:flex"><Cloud size={16} className={saved ? 'text-emerald-500' : 'text-gray-400'} /> {saved ? '임시 저장됨' : '저장되지 않은 변경사항'}</span><div className="flex w-full gap-2 sm:w-auto"><Button variant="secondary" loading={saving} onClick={handleSave} className="flex-1 sm:flex-none"><Cloud size={17} /> 임시 저장</Button><Button loading={submitting} onClick={handleSubmit} className="flex-1 sm:flex-none"><Send size={17} /> 최종 제출</Button></div></div>
    </div>
  )
}

function QuestionInput({ question, value, onChange }: { question: any; value: AnswerValue | undefined; onChange: (value: AnswerValue) => void }) {
  if (question.type === 'long') return <textarea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} className={`${textareaClass} min-h-36`} placeholder="답변을 입력해주세요" />
  if (question.type === 'short' || question.type === 'link') return <input type={question.type === 'link' ? 'url' : 'text'} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder={question.type === 'link' ? 'https://example.com' : '답변을 입력해주세요'} />
  if (question.type === 'single') return <div className="space-y-2">{question.options?.map((option: string) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition ${value === option ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} className="accent-brand-600" />{option}</label>)}</div>
  const selected = Array.isArray(value) ? value : []
  return <div className="space-y-2">{question.options?.map((option: string) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition ${selected.includes(option) ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="checkbox" checked={selected.includes(option)} onChange={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])} className="accent-brand-600" />{option}</label>)}</div>
}
