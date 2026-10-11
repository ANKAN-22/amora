import { db } from '@/admin/review.ts'
import { bumpAdminData } from '@/admin/refresh.ts'

export type AccountAction = 'delete' | 'ban' | 'unban'

type ActionResult = { warnings: string[] }

const FILE_BUCKETS = ['enrollment', 'photos'] as const

async function removeStoredFiles(userId: string) {
  const warnings: string[] = []
  for (const bucket of FILE_BUCKETS) {
    const paths: string[] = []
    for (let offset = 0; ; offset += 100) {
      const listed = await db().storage.from(bucket).list(userId, { limit: 100, offset })
      if (listed.error) {
        warnings.push(`Could not list ${bucket} files: ${listed.error.message}`)
        break
      }
      const files = listed.data ?? []
      for (const file of files) {
        if (file.id) paths.push(`${userId}/${file.name}`)
      }
      if (files.length < 100) break
    }
    if (paths.length === 0) continue
    const removed = await db().storage.from(bucket).remove(paths)
    if (removed.error) warnings.push(`Could not remove ${bucket} files: ${removed.error.message}`)
  }
  return warnings
}

async function callAccountFunction(name: 'admin_ban_account' | 'admin_unban_account', args: Record<string, unknown>) {
  const { error } = await db().rpc(name, args)
  if (error) throw new Error(error.message)
  bumpAdminData()
  return { warnings: [] }
}

// Delete removes photos and the enrollment screenshot, then the login.
// Deleting the login cascades the profile, likes, matches, messages and reports.
export async function runAccountAction(
  action: AccountAction,
  userId: string,
  extra: { reason?: string; confirmEmail?: string } = {},
): Promise<ActionResult> {
  if (action === 'ban') return callAccountFunction('admin_ban_account', { target: userId, reason: extra.reason ?? '' })
  if (action === 'unban') return callAccountFunction('admin_unban_account', { target: userId })

  const warnings = await removeStoredFiles(userId)
  const { data, error } = await db().rpc('admin_delete_account', {
    target: userId,
    confirm_email: extra.confirmEmail ?? '',
  })
  if (error) throw new Error(error.message)
  bumpAdminData()
  const serverWarnings = Array.isArray(data) ? data.filter((item): item is string => typeof item === 'string' && item.length > 0) : []
  return { warnings: [...warnings, ...serverWarnings] }
}
