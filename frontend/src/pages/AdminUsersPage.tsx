import { useEffect, useState } from 'react'
import { Button } from '@/components/Button.tsx'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { statusLabel } from '@/lib/account.ts'
import { listStudents, setStudentStatus, type ReviewStudent } from '@/lib/review.ts'

export function AdminUsersPage() {
  usePageTitle('Users')
  const [students, setStudents] = useState<ReviewStudent[]>([])

  async function load() {
    setStudents(await listStudents())
  }

  useEffect(() => {
    void load()
  }, [])

  async function suspend(student: ReviewStudent) {
    await setStudentStatus(student.id, 'SUSPENDED', 'You can’t use Amora while this account is suspended.')
    await load()
  }

  async function restore(student: ReviewStudent) {
    await setStudentStatus(student.id, 'APPROVED', '')
    await load()
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Users" subtitle="Every student account." />
      {students.length === 0 ? (
        <p className="mt-5 text-sm leading-5 text-mute">No student accounts yet.</p>
      ) : (
        <div className="mt-5 grid gap-3">
          {students.map((student) => (
            <article key={student.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
              <p className="text-lg font-extrabold">{student.name}</p>
              <p className="mt-1 text-sm text-mute">{student.email}</p>
              <p className="mt-1 text-sm text-mute">
                {student.department} · {student.year}
                {student.age ? ` · ${student.age}` : ''}
              </p>
              <p className="mt-1 text-sm text-mute">Student ID {student.studentId || 'not added'}</p>
              <p className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-bold text-coral">
                {statusLabel(student.verificationStatus)}
              </p>
              {student.verificationStatus === 'SUSPENDED' ? (
                <Button fullWidth className="mt-4" onClick={() => restore(student)}>
                  Restore access
                </Button>
              ) : (
                <Button fullWidth className="mt-4" variant="secondary" onClick={() => suspend(student)}>
                  Suspend
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
