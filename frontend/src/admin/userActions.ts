import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { db } from '@/admin/review.ts'
import { bumpAdminData } from '@/admin/refresh.ts'

export type AccountAction = 'delete' | 'ban' | 'unban'

type ActionResult = { warnings: string[] }

async function readError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json()
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') return body.error
    } catch {
      // fall through to the generic message
    }
    return 'The server rejected the request.'
  }
  if (error instanceof FunctionsRelayError) return 'The admin function could not be reached. Check that it is deployed.'
  if (error instanceof FunctionsFetchError) return 'Network error while contacting the admin function.'
  return error instanceof Error ? error.message : 'Something went wrong.'
}

// Delete runs in the database as admin_delete_account. Ban and unban still go to the
// "admin-users" Edge Function. This only resolves when the server confirms the change.
async function deleteAccount(userId: string, confirmEmail: string): Promise<ActionResult> {
  const { data, error } = await db().rpc('admin_delete_account', {
    target: userId,
    confirm_email: confirmEmail,
  })
  if (error) throw new Error(error.message)
  bumpAdminData()
  const warnings = Array.isArray(data) ? data.filter((item): item is string => typeof item === 'string' && item.length > 0) : []
  return { warnings }
}

export async function runAccountAction(
  action: AccountAction,
  userId: string,
  extra: { reason?: string; confirmEmail?: string } = {},
): Promise<ActionResult> {
  if (action === 'delete') return deleteAccount(userId, extra.confirmEmail ?? '')

  const { data, error } = await db().functions.invoke('admin-users', { body: { action, userId, ...extra } })
  if (error) throw new Error(await readError(error))
  if (!data || typeof data !== 'object' || (data as { ok?: unknown }).ok !== true) {
    const message = data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error
      : 'The server did not confirm the change.'
    throw new Error(message)
  }
  const warnings = Array.isArray((data as { warnings?: unknown }).warnings)
    ? ((data as { warnings: unknown[] }).warnings.filter((item) => typeof item === 'string') as string[])
    : []
  bumpAdminData()
  return { warnings }
}
