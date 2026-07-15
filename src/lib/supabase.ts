import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE_OVERRIDE_KEY } from './demoSession'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

const demoHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR_PROJECT_ID') &&
    !supabaseKey.includes('YOUR_PUBLISHABLE'),
)

const localDemoModeRequested = import.meta.env.VITE_DEMO_MODE === 'true' && demoHost
const legacyDemoSessionEnabled =
  typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_OVERRIDE_KEY) === 'true'

// A configured app must use real Supabase sessions, including the four demo
// credentials. The legacy override is kept only for unconfigured local copies
// so an old browser flag cannot silently downgrade an administrator session.
export const isDemoMode = localDemoModeRequested || (!isSupabaseConfigured && legacyDemoSessionEnabled)

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
