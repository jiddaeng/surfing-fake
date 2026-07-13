import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { classNames } from '../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
        variant === 'secondary' && 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-brand-200 hover:bg-brand-50',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' }) {
  const styles = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-violet-50 text-violet-700',
  }
  return <span className={classNames('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles[tone])}>{children}</span>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Inbox size={22} />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('animate-pulse rounded-xl bg-gray-200', className)} />
}

export function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-brand-600">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs leading-5 text-gray-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

export const inputClass = 'focus-ring h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-400'
export const textareaClass = 'focus-ring min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-400'
