import { useEffect, useMemo, useState } from 'react'
import { Eye, FileCode2, GripVertical, ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import type { ApplicationQuestion, QuestionType } from '../types'
import { QUESTION_TYPE_LABEL } from '../types'
import { Button, Field, inputClass } from '../components/ui'
import { uid } from '../lib/utils'

const categories = ['전공', '창업', '학술', '문화예술', '체육', '봉사', '기타']

export function LeaderClubPage() {
  const { profile } = useAuth()
  const { clubs, questions, createClub, updateClub, replaceQuestions, uploadClubLogo } = useData()
  const club = clubs.find((item) => item.leaderId === profile?.id)
  const originalQuestions = useMemo(() => questions.filter((item) => item.clubId === club?.id).sort((a, b) => a.order - b.order), [questions, club?.id])
  const [form, setForm] = useState({ name: '', category: '전공', summary: '', description: '# 동아리를 소개해주세요\n\n동아리의 활동과 모집 정보를 자유롭게 작성하세요.', capacity: 10, color: '#155eef' })
  const [draftQuestions, setDraftQuestions] = useState<ApplicationQuestion[]>([])
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!club) return
    setForm({ name: club.name, category: club.category, summary: club.summary, description: club.description, capacity: club.capacity, color: club.color })
    setDraftQuestions(originalQuestions)
  }, [club?.id, originalQuestions.length])

  const save = async () => {
    if (!form.name.trim() || !form.summary.trim()) { setMessage('동아리 이름과 한 줄 소개를 입력해주세요.'); return }
    if (draftQuestions.some((question) => !question.label.trim())) { setMessage('비어 있는 지원 질문을 작성하거나 삭제해주세요.'); return }
    setSaving(true); setMessage('')
    try {
      const savedClub = club ? (await updateClub(club.id, form), club) : await createClub(form)
      await replaceQuestions(savedClub.id, draftQuestions.map((q, index) => ({ ...q, clubId: savedClub.id, order: index })))
      setMessage('동아리 정보와 지원 질문을 저장했어요.')
    } catch (error) { setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.') }
    finally { setSaving(false) }
  }

  const addQuestion = () => setDraftQuestions((items) => [...items, { id: uid(), clubId: club?.id ?? '', type: 'long', label: '', required: true, order: items.length }])
  const patchQuestion = (id: string, values: Partial<ApplicationQuestion>) => setDraftQuestions((items) => items.map((q) => q.id === id ? { ...q, ...values } : q))

  const logoUpload = async (file?: File) => {
    if (!file || !club) return
    if (file.size > 2 * 1024 * 1024) { setMessage('로고 이미지는 2MB 이하여야 합니다.'); return }
    setUploading(true)
    try { const url = await uploadClubLogo(club.id, file); await updateClub(club.id, { logoUrl: url }); setMessage('로고를 변경했어요.') }
    catch (error) { setMessage(error instanceof Error ? error.message : '로고를 업로드하지 못했습니다.') }
    finally { setUploading(false) }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-brand-600">CLUB EDITOR</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{club ? '동아리 정보 관리' : '새 동아리 등록'}</h1><p className="mt-2 text-sm text-gray-500">소개와 지원 질문을 구성하면 학생들에게 바로 공개됩니다.</p></div><Button onClick={save} loading={saving}><Save size={17} /> 전체 저장</Button></div>

      {message && <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${message.includes('저장했') || message.includes('변경했') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message}</p>}

      <section className="card mt-6 p-5 sm:p-7">
        <h2 className="text-lg font-black">기본 정보</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="동아리 이름" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="동아리 이름" /></Field>
          <Field label="카테고리" required><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <div className="sm:col-span-2"><Field label="한 줄 소개" required hint={`${form.summary.length}/80자`}><input maxLength={80} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputClass} placeholder="학생들이 한눈에 이해할 수 있는 소개" /></Field></div>
          <Field label="모집 인원" required><div className="relative"><input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={`${inputClass} pr-10`} /><span className="absolute right-3.5 top-3 text-sm text-gray-400">명</span></div></Field>
          <Field label="대표 색상"><div className="flex gap-2"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-14 rounded-xl border border-gray-200 bg-white p-1" /><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={inputClass} /></div></Field>
          {club && <div className="sm:col-span-2"><Field label="동아리 로고" hint="PNG, JPG, WEBP 또는 SVG · 최대 2MB"><label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm font-semibold text-gray-600 hover:border-brand-300 hover:bg-brand-50"><ImagePlus size={18} /> {uploading ? '업로드 중...' : '로고 이미지 선택'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => logoUpload(e.target.files?.[0])} /></label></Field></div>}
        </div>
      </section>

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h2 className="text-lg font-black">상세 소개</h2><p className="mt-1 text-xs text-gray-500">Markdown 문법으로 제목, 목록, 표 등을 자유롭게 표현할 수 있어요.</p></div><div className="flex rounded-xl bg-gray-100 p-1"><button onClick={() => setTab('edit')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${tab === 'edit' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}><FileCode2 size={15} /> 작성</button><button onClick={() => setTab('preview')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${tab === 'preview' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}><Eye size={15} /> 미리보기</button></div></div>
        <div className="grid min-h-[28rem] lg:grid-cols-2">
          <div className={`${tab === 'preview' ? 'hidden lg:block' : ''} border-gray-100 lg:border-r`}><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-full min-h-[28rem] w-full resize-none border-0 bg-gray-950 p-5 font-mono text-sm leading-7 text-gray-100 outline-none sm:p-7" spellCheck={false} /></div>
          <div className={`${tab === 'edit' ? 'hidden lg:block' : ''} overflow-auto p-5 sm:p-7`}><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description || '*소개를 작성하면 여기에 미리보기가 표시됩니다.*'}</ReactMarkdown></div></div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-black">지원 질문</h2><p className="mt-1 text-sm text-gray-500">동아리에 맞는 질문을 자유롭게 구성하세요.</p></div><Button variant="secondary" onClick={addQuestion}><Plus size={17} /> 질문 추가</Button></div>
        <div className="mt-4 space-y-3">{draftQuestions.map((question, index) => <div key={question.id} className="card p-4 sm:p-5"><div className="flex gap-3"><GripVertical size={19} className="mt-3 shrink-0 text-gray-300" /><div className="min-w-0 flex-1"><div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><input value={question.label} onChange={(e) => patchQuestion(question.id, { label: e.target.value })} className={inputClass} placeholder={`질문 ${index + 1} 내용을 입력하세요`} /><select value={question.type} onChange={(e) => patchQuestion(question.id, { type: e.target.value as QuestionType, options: ['single','multiple'].includes(e.target.value) ? question.options ?? ['선택지 1', '선택지 2'] : undefined })} className={inputClass}>{Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><input value={question.description ?? ''} onChange={(e) => patchQuestion(question.id, { description: e.target.value })} className={`${inputClass} mt-3`} placeholder="질문에 대한 추가 설명 (선택)" />
                  {['single', 'multiple'].includes(question.type) && <div className="mt-3 space-y-2">{(question.options ?? []).map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><input value={option} onChange={(e) => patchQuestion(question.id, { options: question.options?.map((item, i) => i === optionIndex ? e.target.value : item) })} className={inputClass} placeholder={`선택지 ${optionIndex + 1}`} /><button onClick={() => patchQuestion(question.id, { options: question.options?.filter((_, i) => i !== optionIndex) })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button></div>)}<button onClick={() => patchQuestion(question.id, { options: [...(question.options ?? []), `선택지 ${(question.options?.length ?? 0) + 1}`] })} className="text-xs font-bold text-brand-600">+ 선택지 추가</button></div>}
                  <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-600"><input type="checkbox" checked={question.required} onChange={(e) => patchQuestion(question.id, { required: e.target.checked })} className="accent-brand-600" /> 필수 질문</label></div><button onClick={() => setDraftQuestions((items) => items.filter((item) => item.id !== question.id))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label="질문 삭제"><Trash2 size={17} /></button></div></div>)}</div>
      </section>

      <div className="mt-6 flex justify-end"><Button size="lg" onClick={save} loading={saving}><Save size={18} /> 전체 저장</Button></div>
    </div>
  )
}
