import type { VerificationStatus } from '@/lib/account.ts'
import { adminSupabase } from '@/lib/supabase.ts'

export type ReviewStudent = {
  id: string
  name: string
  email: string
  age: number
  department: string
  year: string
  studentId: string
  verificationStatus: VerificationStatus
  reviewNote: string
  screenshotUrl: string
}

export type ReviewReport = {
  id: string
  name: string
  reason: string
  messageId: string
  resolved: boolean
}

type StudentRow = {
  id: string
  name: string
  email: string
  age: number
  department: string
  year: string
  student_id: string
  verification_status: VerificationStatus
  review_note: string
  screenshot_path: string | null
  is_admin: boolean
}

function isStatus(value: string): value is VerificationStatus {
  return (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'REJECTED' ||
    value === 'RESUBMISSION_REQUIRED' ||
    value === 'SUSPENDED'
  )
}

export async function reviewSummary() {
  if (!adminSupabase) return { pending: 0, students: 0, openReports: 0 }
  const [students, reports] = await Promise.all([
    adminSupabase.from('profiles').select('id, verification_status, is_admin').eq('is_admin', false),
    adminSupabase.from('reports').select('id, resolved').eq('resolved', false),
  ])
  const rows = (students.data ?? []) as { verification_status: string }[]
  return {
    pending: rows.filter((row) => row.verification_status === 'PENDING').length,
    students: rows.length,
    openReports: (reports.data ?? []).length,
  }
}

export async function listStudents(): Promise<ReviewStudent[]> {
  if (!adminSupabase) return []
  const { data } = await adminSupabase
    .from('profiles')
    .select('id, name, email, age, department, year, student_id, verification_status, review_note, screenshot_path, is_admin')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
  const rows = ((data ?? []) as StudentRow[]).filter((row) => isStatus(row.verification_status))
  const paths = rows.map((row) => row.screenshot_path).filter((path): path is string => Boolean(path))
  const signed: Record<string, string> = {}
  if (paths.length > 0) {
    const { data: files } = await adminSupabase.storage.from('enrollment').createSignedUrls(paths, 60 * 60)
    for (const file of files ?? []) {
      if (file.path && file.signedUrl) signed[file.path] = file.signedUrl
    }
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name || 'Student',
    email: row.email,
    age: row.age,
    department: row.department,
    year: row.year,
    studentId: row.student_id,
    verificationStatus: row.verification_status,
    reviewNote: row.review_note,
    screenshotUrl: row.screenshot_path ? signed[row.screenshot_path] ?? '' : '',
  }))
}

export async function setStudentStatus(id: string, status: VerificationStatus, reviewNote: string) {
  if (!adminSupabase) return false
  const { error } = await adminSupabase
    .from('profiles')
    .update({ verification_status: status, review_note: reviewNote })
    .eq('id', id)
  return !error
}

export async function listReports(): Promise<ReviewReport[]> {
  if (!adminSupabase) return []
  const { data } = await adminSupabase
    .from('reports')
    .select('id, target_id, reason, message_id, resolved, created_at')
    .order('created_at', { ascending: false })
  const reports = (data ?? []) as {
    id: string
    target_id: string
    reason: string
    message_id: string | null
    resolved: boolean
  }[]
  const ids = [...new Set(reports.map((report) => report.target_id))]
  const names: Record<string, string> = {}
  if (ids.length > 0) {
    const { data: profiles } = await adminSupabase.from('profiles').select('id, name').in('id', ids)
    for (const profile of (profiles ?? []) as { id: string; name: string }[]) names[profile.id] = profile.name
  }
  return reports.map((report) => ({
    id: report.id,
    name: names[report.target_id] || 'Student',
    reason: report.reason,
    messageId: report.message_id ?? '',
    resolved: report.resolved,
  }))
}

export async function markReportReviewed(id: string) {
  if (!adminSupabase) return
  await adminSupabase.from('reports').update({ resolved: true }).eq('id', id)
}
