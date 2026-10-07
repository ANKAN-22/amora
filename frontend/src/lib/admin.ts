import { useSyncExternalStore } from 'react'
import { adminSupabase } from '@/lib/supabase.ts'

type AdminState = {
  ready: boolean
  authed: boolean
}

let state: AdminState = { ready: false, authed: false }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function commit(next: AdminState) {
  state = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAdmin() {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

async function loadAdmin() {
  if (!adminSupabase) {
    commit({ ready: true, authed: false })
    return
  }
  const { data } = await adminSupabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) {
    commit({ ready: true, authed: false })
    return
  }
  const { data: profile } = await adminSupabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
  const authed = profile?.is_admin === true
  if (!authed) await adminSupabase.auth.signOut()
  commit({ ready: true, authed })
}

void loadAdmin()

export async function loginAdmin(email: string, password: string) {
  if (!adminSupabase) return 'Add your Supabase URL and anon key to frontend/.env, then restart the app.'
  const { data, error } = await adminSupabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error || !data.user) return 'That reviewer login doesn’t match.'
  const { data: profile } = await adminSupabase.from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle()
  if (profile?.is_admin !== true) {
    await adminSupabase.auth.signOut()
    commit({ ready: true, authed: false })
    return 'That account is not a reviewer. Mark it as admin in Supabase first.'
  }
  commit({ ready: true, authed: true })
  return null
}

export async function logoutAdmin() {
  await adminSupabase?.auth.signOut()
  commit({ ready: true, authed: false })
}
