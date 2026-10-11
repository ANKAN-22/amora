// Supabase Edge Function: admin-users
// Server-side account actions for the Amora admin panel: delete, ban, unban.
//
// Authorization happens HERE, not in the browser:
//   1. the caller's JWT is verified with Supabase Auth,
//   2. profiles.is_admin is read with the service-role key,
//   3. only then is anything changed.
// The service-role key is read from the function's environment and never leaves the server.

import { createClient } from 'npm:@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') ?? '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BUCKETS = ['enrollment', 'photos'] as const
const BAN_DURATION = '876000h' // ~100 years

type Action = 'delete' | 'ban' | 'unban'

type TargetProfile = {
  id: string
  email: string
  name: string
  is_admin: boolean
  verification_status: string
  account_status: string
  pre_ban_status: string | null
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(status: number, message: string) {
  return reply(status, { ok: false, error: message })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return fail(405, 'Method not allowed.')

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return fail(500, 'Function is not configured.')

  // 1. Who is calling?
  const header = req.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return fail(401, 'Sign in as an admin first.')

  const verifier = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: caller, error: callerError } = await verifier.auth.getUser(token)
  if (callerError || !caller.user) return fail(401, 'Your session is not valid. Log in again.')

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  // 2. Is the caller really an admin? (read server-side, never trusted from the client)
  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, is_admin')
    .eq('id', caller.user.id)
    .maybeSingle()
  if (profileError) return fail(500, 'Could not verify admin permissions.')
  if (!callerProfile || callerProfile.is_admin !== true) return fail(403, 'Admin permission required.')
  const adminId = caller.user.id

  // 3. Validate input
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return fail(400, 'Request body must be JSON.')
  }
  const action = body.action
  const userId = body.userId
  if (action !== 'delete' && action !== 'ban' && action !== 'unban') return fail(400, 'Unknown action.')
  if (typeof userId !== 'string' || !UUID.test(userId)) return fail(400, 'A valid userId is required.')
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : ''
  const confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : ''

  const { data: targetRow, error: targetError } = await admin
    .from('profiles')
    .select('id, email, name, is_admin, verification_status, account_status, pre_ban_status')
    .eq('id', userId)
    .maybeSingle()
  if (targetError) return fail(500, 'Could not load that account.')
  if (!targetRow) return fail(404, 'That account no longer exists.')
  const target = targetRow as TargetProfile

  async function audit(kind: Action, details: Record<string, unknown>) {
    const { error } = await admin
      .from('admin_audit_log')
      .insert({ admin_id: adminId, action: kind, target_id: userId, details })
    return error ? 'The action succeeded but could not be written to the audit log.' : null
  }

  // 4. Act
  if (action === 'delete') return await deleteAccount()
  if (action === 'ban') return await banAccount()
  return await unbanAccount()

  async function deleteAccount() {
    if (target.id === adminId) return fail(400, 'You cannot delete your own account from the admin panel.')
    if (confirmEmail !== target.email.trim().toLowerCase()) {
      return fail(400, 'The confirmation email does not match this account.')
    }
    if (target.is_admin) {
      const { count, error } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', true)
      if (error) return fail(500, 'Could not count administrators.')
      if ((count ?? 0) <= 1) return fail(409, 'This is the last administrator and cannot be deleted.')
    }

    // Deleting the auth user cascades to profiles, likes, matches, messages, reports and
    // subscriptions. payments.user_id is set to null (kept for financial records).
    const { error: deleteError } = await admin.auth.admin.deleteUser(target.id)
    if (deleteError) return fail(500, `Deletion failed: ${deleteError.message}`)

    // Confirm the profile is really gone before reporting success.
    const { data: leftover } = await admin.from('profiles').select('id').eq('id', target.id).maybeSingle()
    if (leftover) return fail(500, 'The login was removed but the profile row still exists. Check the database.')

    const warnings: string[] = []
    for (const bucket of BUCKETS) {
      const cleanup = await removeFolder(bucket, target.id)
      if (cleanup) warnings.push(cleanup)
    }
    const auditWarning = await audit('delete', {
      was_admin: target.is_admin,
      verification_status: target.verification_status,
    })
    if (auditWarning) warnings.push(auditWarning)

    return reply(200, { ok: true, warnings })
  }

  async function removeFolder(bucket: string, folder: string) {
    try {
      const paths: string[] = []
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset })
        if (error) return `Could not list files in ${bucket}: ${error.message}`
        const files = data ?? []
        for (const file of files) paths.push(`${folder}/${file.name}`)
        if (files.length < 100) break
      }
      if (paths.length === 0) return null
      const { error } = await admin.storage.from(bucket).remove(paths)
      return error ? `Could not remove files in ${bucket}: ${error.message}` : null
    } catch (error) {
      return `Storage cleanup failed for ${bucket}: ${error instanceof Error ? error.message : 'unknown error'}`
    }
  }

  async function banAccount() {
    if (target.id === adminId) return fail(400, 'You cannot ban your own account.')
    if (target.is_admin) return fail(409, 'Administrators cannot be banned. Remove admin access first.')
    if (target.account_status === 'BANNED') return fail(409, 'This account is already banned.')

    const { error: banError } = await admin.auth.admin.updateUserById(target.id, { ban_duration: BAN_DURATION })
    if (banError) return fail(500, `Ban failed: ${banError.message}`)

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        account_status: 'BANNED',
        ban_reason: reason,
        pre_ban_status: target.verification_status,
        verification_status: 'SUSPENDED',
        review_note: 'This account has been banned.',
      })
      .eq('id', target.id)
    if (updateError) {
      await admin.auth.admin.updateUserById(target.id, { ban_duration: 'none' }) // roll back
      return fail(500, `Ban failed: ${updateError.message}`)
    }

    const warning = await audit('ban', { reason })
    return reply(200, { ok: true, warnings: warning ? [warning] : [] })
  }

  async function unbanAccount() {
    if (target.account_status !== 'BANNED') return fail(409, 'This account is not banned.')

    const { error: unbanError } = await admin.auth.admin.updateUserById(target.id, { ban_duration: 'none' })
    if (unbanError) return fail(500, `Unban failed: ${unbanError.message}`)

    const restored = target.pre_ban_status && target.pre_ban_status !== 'SUSPENDED' ? target.pre_ban_status : 'PENDING'
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        account_status: 'ACTIVE',
        ban_reason: '',
        pre_ban_status: null,
        verification_status: restored,
        review_note: '',
      })
      .eq('id', target.id)
    if (updateError) {
      await admin.auth.admin.updateUserById(target.id, { ban_duration: BAN_DURATION }) // roll back
      return fail(500, `Unban failed: ${updateError.message}`)
    }

    const warning = await audit('unban', { restored_status: restored })
    return reply(200, { ok: true, warnings: warning ? [warning] : [] })
  }
})
