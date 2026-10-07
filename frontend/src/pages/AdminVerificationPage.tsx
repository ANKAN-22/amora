import { useEffect, useState } from 'react'
import { Button } from '@/components/Button.tsx'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { statusLabel } from '@/lib/account.ts'
import { listStudents, setStudentStatus, type ReviewStudent } from '@/lib/review.ts'

export function AdminVerificationPage() {
  usePageTitle('Verification')
  const [students, setStudents] = useState<ReviewStudent[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState('')

  async function load() {
    const rows = await listStudents()
    setStudents(rows)
    setNotes(Object.fromEntries(rows.map((student) => [student.id, student.reviewNote])))
  }

  useEffect(() => {
    void load()
  }, [])

  async function apply(student: ReviewStudent, status: 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED', reviewNote: string) {
    const wrote = await setStudentStatus(student.id, status, reviewNote)
    if (!wrote) return
    setSaved(`${student.name} · ${statusLabel(status)}`)
    await load()
  }

  const queue = students.filter((student) => student.verificationStatus !== 'APPROVED' || student.screenshotUrl)

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Verification" subtitle="Enrollment screenshots from every student." />
      {queue.length === 0 ? (
        <p className="mt-5 text-sm leading-5 text-mute">No students have submitted a screenshot yet.</p>
      ) : (
        <div className="mt-5 grid gap-4">
          {queue.map((student) => (
            <article key={student.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
              <p className="text-lg font-extrabold">{student.name}</p>
              <p className="mt-1 text-sm text-mute">
                {student.department} · {student.year}
              </p>
              <p className="mt-1 text-sm text-mute">{student.email}</p>
              <p className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-bold text-coral">
                {statusLabel(student.verificationStatus)}
              </p>
              {student.screenshotUrl ? (
                <img
                  src={student.screenshotUrl}
                  alt="Enrollment screenshot"
                  className="mt-4 max-h-80 w-full rounded-[1.4rem] bg-white object-contain ring-1 ring-black/5"
                />
              ) : (
                <p className="mt-4 text-sm leading-5 text-mute">No enrollment screenshot yet.</p>
              )}
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold">Note for the student</span>
                <textarea
                  value={notes[student.id] ?? ''}
                  onChange={(event) => setNotes({ ...notes, [student.id]: event.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-2xl bg-[#fff5f7] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:bg-white focus:ring-coral"
                />
              </label>
              <div className="mt-4 grid gap-2">
                <Button fullWidth onClick={() => apply(student, 'APPROVED', '')}>
                  Approve
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() =>
                    apply(student, 'REJECTED', (notes[student.id] ?? '').trim() || 'The screenshot doesn’t show current enrollment.')
                  }
                >
                  Decline
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() =>
                    apply(
                      student,
                      'RESUBMISSION_REQUIRED',
                      (notes[student.id] ?? '').trim() || 'Upload a screenshot that shows your name and current enrollment.',
                    )
                  }
                >
                  Ask for a new screenshot
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {saved ? <p className="mt-4 text-sm font-semibold text-coral">Saved as {saved}.</p> : null}
    </div>
  )
}
