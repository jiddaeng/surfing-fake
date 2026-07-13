export const formatDate = (iso: string, withTime = false) => {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export const formatFullDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export const daysUntil = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export const isRecruiting = (start: string, end: string) => {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

export const isResultPublished = (at: string) => Date.now() >= new Date(at).getTime()

export const toDateTimeLocal = (iso: string) => {
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export const uid = () => crypto.randomUUID()
