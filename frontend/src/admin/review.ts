import type { VerificationStatus } from '@/lib/account.ts'
import { adminSupabase } from '@/lib/supabase.ts'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AccountStatus = 'ACTIVE' | 'BANNED'

export type AdminUser = {
  id: string
  name: string
  email: string
  age: number
  department: string
  year: string
  studentId: string
  gender: string
  bio: string
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
  banReason: string
  reviewNote: string
  screenshotPath: string | null
  screenshotUrl: string
  submittedAt: string | null
  isAdmin: boolean
  createdAt: string
  premiumActive: boolean
  premiumExpiresAt: string | null
}

export type PersonRef = {
  id: string
  name: string
  email: string
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
  isAdmin: boolean
}

export type ReviewReport = {
  id: string
  reason: string
  messageId: string
  messageBody: string
  resolved: boolean
  createdAt: string
  reviewedAt: string | null
  actionTaken: string
  reporter: PersonRef | null
  target: PersonRef | null
}

export type DashboardStats = {
  totalUsers: number
  verified: number
  pending: number
  banned: number
  activePremium: number
  openReports: number
  successfulPayments: number
  revenue: { currency: string; minor: number }[]
}

type ProfileRow = {
  id: string
  name: string
  email: string
  age: number
  department: string
  year: string
  student_id: string
  gender: string
  bio: string
  verification_status: string
  account_status: string
  ban_reason: string
  review_note: string
  screenshot_path: string | null
  submitted_at: string | null
  is_admin: boolean
  created_at: string
}

type SubscriptionRow = { user_id: string; status: string; expires_at: string | null }

const PROFILE_COLUMNS =
  'id, name, email, age, department, year, student_id, gender, bio, verification_status, account_status, ban_reason, review_note, screenshot_path, submitted_at, is_admin, created_at'

const PAGE = 1000

export function db(): SupabaseClient {
  if (!adminSupabase) throw new Error('Supabase is not configured. Add your URL and anon key to frontend/.env.')
  return adminSupabase
}

export function isVerificationStatus(value: string): value is VerificationStatus {
  return (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'REJECTED' ||
    value === 'RESUBMISSION_REQUIRED' ||
    value === 'SUSPENDED'
  )
}

type Page = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>

export async function fetchAll<T>(build: (from: number, to: number) => Page): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

async function countOf(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

export function accountState(user: AdminUser): 'BANNED' | 'SUSPENDED' | 'ACTIVE' {
  if (user.accountStatus === 'BANNED') return 'BANNED'
  if (user.verificationStatus === 'SUSPENDED') return 'SUSPENDED'
  return 'ACTIVE'
}

export function isPremiumActive(status: string, expiresAt: string | null) {
  if (status !== 'ACTIVE') return false
  return expiresAt === null || new Date(expiresAt).getTime() > Date.now()
}

function toPerson(row: ProfileRow): PersonRef {
  return {
    id: row.id,
    name: row.name || 'Student',
    email: row.email,
    verificationStatus: isVerificationStatus(row.verification_status) ? row.verification_status : 'PENDING',
    accountStatus: row.account_status === 'BANNED' ? 'BANNED' : 'ACTIVE',
    isAdmin: row.is_admin,
  }
}

async function signedScreenshots(paths: string[]) {
  const signed: Record<string, string> = {}
  if (paths.length === 0) return signed
  const { data } = await db().storage.from('enrollment').createSignedUrls(paths, 60 * 60)
  for (const file of data ?? []) {
    if (file.path && file.signedUrl) signed[file.path] = file.signedUrl
  }
  return signed
}

export async function listUsers(options: { withScreenshots?: boolean } = {}): Promise<AdminUser[]> {
  const client = db()
  const [profiles, subscriptions] = await Promise.all([
    fetchAll<ProfileRow>((from, to) =>
      client.from('profiles').select(PROFILE_COLUMNS).order('created_at', { ascending: false }).order('id').range(from, to),
    ),
    fetchAll<SubscriptionRow>((from, to) =>
      client.from('subscriptions').select('user_id, status, expires_at').order('id').range(from, to),
    ),
  ])

  const premium = new Map<string, string | null>()
  for (const sub of subscriptions) {
    if (!isPremiumActive(sub.status, sub.expires_at)) continue
    const current = premium.get(sub.user_id)
    if (current === null) continue // an open-ended subscription already wins
    if (sub.expires_at === null || current === undefined || new Date(sub.expires_at) > new Date(current)) {
      premium.set(sub.user_id, sub.expires_at)
    }
  }

  const paths = options.withScreenshots
    ? profiles.map((row) => row.screenshot_path).filter((path): path is string => Boolean(path))
    : []
  const signed = await signedScreenshots(paths)

  return profiles.map((row) => ({
    id: row.id,
    name: row.name || 'Student',
    email: row.email,
    age: row.age,
    department: row.department,
    year: row.year,
    studentId: row.student_id,
    gender: row.gender,
    bio: row.bio,
    verificationStatus: isVerificationStatus(row.verification_status) ? row.verification_status : 'PENDING',
    accountStatus: row.account_status === 'BANNED' ? 'BANNED' : 'ACTIVE',
    banReason: row.ban_reason,
    reviewNote: row.review_note,
    screenshotPath: row.screenshot_path,
    screenshotUrl: row.screenshot_path ? (signed[row.screenshot_path] ?? '') : '',
    submittedAt: row.submitted_at,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    premiumActive: premium.has(row.id),
    premiumExpiresAt: premium.get(row.id) ?? null,
  }))
}

export async function loadDashboardStats(): Promise<DashboardStats> {
  const client = db()
  const nowIso = new Date().toISOString()
  const students = () => client.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', false)

  const [totalUsers, verified, pending, banned, activePremium, openReports, succeeded] = await Promise.all([
    countOf(students()),
    countOf(students().eq('verification_status', 'APPROVED')),
    countOf(students().eq('verification_status', 'PENDING')),
    countOf(students().eq('account_status', 'BANNED')),
    countOf(
      client
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    ),
    countOf(client.from('reports').select('id', { count: 'exact', head: true }).eq('resolved', false)),
    fetchAll<{ amount_minor: number; currency: string }>((from, to) =>
      client.from('payments').select('amount_minor, currency').eq('status', 'SUCCEEDED').order('id').range(from, to),
    ),
  ])

  const totals = new Map<string, number>()
  for (const payment of succeeded) {
    totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + Number(payment.amount_minor))
  }

  return {
    totalUsers,
    verified,
    pending,
    banned,
    activePremium,
    openReports,
    successfulPayments: succeeded.length,
    revenue: [...totals.entries()].map(([currency, minor]) => ({ currency, minor })),
  }
}

// Verification -----------------------------------------------------------------

export async function listVerificationQueue(): Promise<AdminUser[]> {
  const users = await listUsers({ withScreenshots: true })
  return users.filter((user) => !user.isAdmin && (user.verificationStatus !== 'APPROVED' || user.screenshotUrl))
}

// Writes the status and checks that a row really changed. Row-level security makes a
// blocked update look like "0 rows", so an empty result is treated as a failure.
export async function setStudentStatus(id: string, status: VerificationStatus, reviewNote: string) {
  const { data, error } = await db()
    .from('profiles')
    .update({ verification_status: status, review_note: reviewNote })
    .eq('id', id)
    .eq('is_admin', false)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('The change was not saved. You may not have permission, or the account is gone.')
}

// Reports -----------------------------------------------------------------------

export async function listReports(): Promise<ReviewReport[]> {
  const client = db()
  const reports = await fetchAll<{
    id: string
    reporter_id: string
    target_id: string
    message_id: string | null
    reason: string
    resolved: boolean
    created_at: string
    reviewed_at: string | null
    action_taken: string
  }>((from, to) =>
    client
      .from('reports')
      .select('id, reporter_id, target_id, message_id, reason, resolved, created_at, reviewed_at, action_taken')
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
  )

  const personIds = [...new Set(reports.flatMap((report) => [report.reporter_id, report.target_id]))]
  const people = new Map<string, PersonRef>()
  for (let i = 0; i < personIds.length; i += 200) {
    const { data, error } = await client.from('profiles').select(PROFILE_COLUMNS).in('id', personIds.slice(i, i + 200))
    if (error) throw new Error(error.message)
    for (const row of (data ?? []) as ProfileRow[]) people.set(row.id, toPerson(row))
  }

  const messageIds = [...new Set(reports.map((report) => report.message_id).filter((id): id is string => Boolean(id)))]
  const bodies = new Map<string, string>()
  for (let i = 0; i < messageIds.length; i += 200) {
    const { data, error } = await client.from('messages').select('id, body').in('id', messageIds.slice(i, i + 200))
    if (error) throw new Error(error.message)
    for (const row of (data ?? []) as { id: string; body: string }[]) bodies.set(row.id, row.body)
  }

  return reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    messageId: report.message_id ?? '',
    messageBody: report.message_id ? (bodies.get(report.message_id) ?? '') : '',
    resolved: report.resolved,
    createdAt: report.created_at,
    reviewedAt: report.reviewed_at,
    actionTaken: report.action_taken,
    reporter: people.get(report.reporter_id) ?? null,
    target: people.get(report.target_id) ?? null,
  }))
}

export async function markReportReviewed(id: string, adminId: string | null, actionTaken: string) {
  const { data, error } = await db()
    .from('reports')
    .update({ resolved: true, reviewed_at: new Date().toISOString(), reviewed_by: adminId, action_taken: actionTaken })
    .eq('id', id)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('The report was not updated. You may not have permission.')
}
