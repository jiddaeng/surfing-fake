import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

const demoHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

// Demo authentication is deliberately limited to the local machine. It stores
// credentials and roles in localStorage and must never protect a deployed site.
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' && demoHost

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
