import { Moon, Sun } from 'lucide-react'
import { useContext } from 'react'
import { ThemeContext } from '../context/theme'

export function ThemeToggle() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('ThemeToggle은 ThemeProvider 안에서 사용해야 합니다.')

  const isDark = context.theme === 'dark'

  return (
    <button
      type="button"
      onClick={context.toggleTheme}
      className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드' : '다크 모드'}
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}
