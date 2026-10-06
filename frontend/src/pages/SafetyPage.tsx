import { studentById } from '@/data/students.ts'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { StudentAvatar } from '@/components/StudentAvatar.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { unblockStudent, unhideStudent, useSocial } from '@/lib/social.ts'

function PersonRow({
  name,
  detail,
  action,
  onAction,
  studentId,
}: {
  name: string
  detail: string
  action: string
  onAction: () => void
  studentId: string
}) {
  const student = studentById(studentId)
  return (
    <li className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-card ring-1 ring-black/[0.04]">
      {student ? <StudentAvatar student={student} className="size-12 text-lg" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{name}</span>
        <span className="mt-0.5 block truncate text-sm text-mute">{detail}</span>
      </span>
      <button type="button" className="h-9 shrink-0 rounded-full bg-blush px-4 text-sm font-semibold" onClick={onAction}>
        {action}
      </button>
    </li>
  )
}

export function SafetyPage() {
  usePageTitle('Safety')
  const social = useSocial()
  const blocked = social.blocks.map((id) => studentById(id)).filter((student) => student !== null)
  const hidden = social.hidden.map((id) => studentById(id)).filter((student) => student !== null)
  const reports = [...social.reports].reverse()

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader
        backTo="/profile"
        title="Safety"
        subtitle="Block, hide, and the reports saved on this browser."
      />

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Blocked</h2>
        {blocked.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">No one is blocked.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {blocked.map((student) => (
              <PersonRow
                key={student.id}
                studentId={student.id}
                name={student.name}
                detail="Hidden from Discover, Likes, and Matches"
                action="Unblock"
                onAction={() => unblockStudent(student.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Hidden from Discover</h2>
        {hidden.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">
            Open someone’s profile and choose Hide. They leave Discover, and you can bring them back here.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {hidden.map((student) => (
              <PersonRow
                key={student.id}
                studentId={student.id}
                name={student.name}
                detail={student.department}
                action="Unhide"
                onAction={() => unhideStudent(student.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Reports</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">
            Report someone from their profile or from a chat. A reviewer can see these once the admin queue exists.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {reports.map((report) => {
              const student = studentById(report.studentId)
              return (
                <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 shadow-card ring-1 ring-black/[0.04]">
                  <p className="font-bold">{student?.name ?? 'Student'}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {report.reason}
                    {report.messageId ? ' · Message' : ' · Profile'}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
