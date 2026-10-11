import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { statusLabel } from '@/lib/account.ts'
import { listVerificationQueue, setStudentStatus, type AdminUser } from '@/admin/review.ts'
import { bumpAdminData, useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatDateTime } from '@/admin/format.ts'
import { Empty, Loading, Notice, PageTitle, Pill, smallButton, smallSecondary, type NoticeState } from '@/admin/ui.tsx'

type Outcome = 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED'

export function AdminVerificationPage() {
  usePageTitle('Verification')
  const version = useAdminDataVersion()
  const [students, setStudents] = useState<AdminUser[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<NoticeState>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [onlyPending, setOnlyPending] = useState(true)

  const load = useCallback(async () => {
    try {
      const rows = await listVerificationQueue()
      setStudents(rows)
      setNotes((current) => {
        const next: Record<string, string> = {}
        for (const row of rows) next[row.id] = current[row.id] ?? row.reviewNote
        return next
      })
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  async function apply(student: AdminUser, status: Outcome) {
    const typed = (notes[student.id] ?? '').trim()
    const note =
      status === 'APPROVED'
        ? ''
        : typed ||
          (status === 'REJECTED'
            ? 'The screenshot doesn’t show current enrollment.'
            : 'Upload a screenshot that shows your name and current enrollment.')
    setBusyId(student.id)
    setNotice(null)
    try {
      await setStudentStatus(student.id, status, note)
      setNotice({ kind: 'success', text: `${student.name} · ${statusLabel(status)}` })
      bumpAdminData()
    } catch (err) {
      setNotice({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusyId('')
    }
  }

  const pendingCount = (students ?? []).filter((student) => student.verificationStatus === 'PENDING').length
  const shown = (students ?? []).filter((student) => !onlyPending || student.verificationStatus === 'PENDING')

  return (
    <div>
      <PageTitle title="Verification" subtitle="Enrollment screenshots submitted by students." />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Notice notice={error ? { kind: 'error', text: error } : null} />

      <div className="mt-5 flex gap-2">
        <button type="button" className={`${smallButton} ${onlyPending ? 'bg-coral text-white' : 'bg-white ring-1 ring-black/10'}`} onClick={() => setOnlyPending(true)}>
          Pending ({pendingCount})
        </button>
        <button type="button" className={`${smallButton} ${!onlyPending ? 'bg-coral text-white' : 'bg-white ring-1 ring-black/10'}`} onClick={() => setOnlyPending(false)}>
          Everyone with proof
        </button>
      </div>

      {!students && !error ? <Loading /> : null}
      {students && shown.length === 0 ? <Empty>{onlyPending ? 'No pending verification requests.' : 'No students have submitted a screenshot yet.'}</Empty> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {shown.map((student) => {
          const busy = busyId === student.id
          const banned = student.accountStatus === 'BANNED'
          return (
            <article key={student.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold break-words">{student.name}</p>
                  <p className="text-sm break-all text-mute">{student.email}</p>
                  <p className="mt-1 text-sm text-mute">
                    {[student.department, student.year].filter(Boolean).join(' · ') || 'No profile details'}
                    {student.studentId ? ` · ID ${student.studentId}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-mute">Submitted {formatDateTime(student.submittedAt)}</p>
                </div>
                <Pill tone={student.verificationStatus === 'APPROVED' ? 'ok' : student.verificationStatus === 'PENDING' ? 'warn' : 'neutral'}>
                  {statusLabel(student.verificationStatus)}
                </Pill>
              </div>

              {student.screenshotUrl ? (
                <a href={student.screenshotUrl} target="_blank" rel="noreferrer">
                  <img src={student.screenshotUrl} alt={`Enrollment proof from ${student.name}`} className="mt-4 max-h-80 w-full rounded-[1.4rem] bg-white object-contain ring-1 ring-black/5" />
                </a>
              ) : (
                <p className="mt-4 text-sm leading-5 text-mute">No enrollment screenshot yet.</p>
              )}

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold">Note for the student</span>
                <textarea
                  value={notes[student.id] ?? ''}
                  onChange={(event) => setNotes({ ...notes, [student.id]: event.target.value })}
                  rows={3}
                  maxLength={300}
                  className="w-full resize-none rounded-2xl bg-[#fff5f7] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:bg-white focus:ring-coral"
                />
              </label>

              {banned ? (
                <p className="mt-3 text-sm text-red-700">This account is banned. Unban it from Users before changing verification.</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void apply(student, 'APPROVED')} className={`${smallButton} bg-coral text-white hover:bg-coral-deep`}>
                    {busy ? <LoaderCircle size={14} className="animate-spin" /> : null} Approve
                  </button>
                  <button type="button" disabled={busy} onClick={() => void apply(student, 'REJECTED')} className={smallSecondary}>
                    Reject
                  </button>
                  <button type="button" disabled={busy} onClick={() => void apply(student, 'RESUBMISSION_REQUIRED')} className={smallSecondary}>
                    Request new proof
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
