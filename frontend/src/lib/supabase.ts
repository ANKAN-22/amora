import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = typeof import.meta.env.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL.trim() : ''
const key = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : ''

export const supabaseConfigured = url.startsWith('https://') && key.length > 20

function client(storageKey: string, detectSessionInUrl: boolean): SupabaseClient | null {
  if (!supabaseConfigured) return null
  return createClient(url, key, {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl,
    },
  })
}

export const supabase = client('amora.auth', true)
export const adminSupabase = client('amora.admin.auth', false)
