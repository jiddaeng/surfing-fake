import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE_OVERRIDE_KEY } from './demoSession'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

const demoHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
const demoSessionEnabled = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_OVERRIDE_KEY) === 'true'

// A selected demo account reloads the app into an isolated local-only data mode.
// Demo roles never receive a Supabase session and therefore cannot access protected data.
export const isDemoMode = (import.meta.env.VITE_DEMO_MODE === 'true' && demoHost) || demoSessionEnabled

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR_PROJECT_ID') &&
    !supabaseKey.includes('YOUR_PUBLISHABLE'),
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  : null

export const isTrustedClubLogoUrl = (candidate?: string) => {
  if (!candidate) return false
  if (isDemoMode && /^data:image\/(?:png|jpeg|webp);base64,/i.test(candidate)) return true
  if (!isSupabaseConfigured) return false
  try {
    const url = new URL(candidate)
    const endpoint = new URL(supabaseUrl)
    return url.origin === endpoint.origin && url.pathname.startsWith('/storage/v1/object/public/club-logos/')
  } catch {
    return false
  }
}
