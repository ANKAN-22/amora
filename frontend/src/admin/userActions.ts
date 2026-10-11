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

// Every call goes to the "admin-users" Edge Function, which re-checks admin permission on the server.
// This only resolves when the server reports { ok: true }; anything else throws.
export async function runAccountAction(
  action: AccountAction,
  userId: string,
  extra: { reason?: string; confirmEmail?: string } = {},
): Promise<ActionResult> {
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
