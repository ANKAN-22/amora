import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { studentById } from '@/data/students.ts'
import { markReportReviewed, useSocial } from '@/lib/social.ts'

export function AdminReportsPage() {
  usePageTitle('Reports')
  const social = useSocial()
  const open = social.reports.filter((report) => !report.resolved)
  const reviewed = social.reports.filter((report) => report.resolved)

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Reports" subtitle="Saved from profiles and chats on this browser." />

      <section className="mt-5">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Open</h2>
        {open.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">No open reports.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {open.map((report) => {
              const student = studentById(report.studentId)
              return (
                <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 shadow-card ring-1 ring-black/[0.04]">
                  <p className="font-bold">{student?.name ?? 'Student'}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {report.reason}
                    {report.messageId ? ' · Message' : ' · Profile'}
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-sm font-semibold text-coral"
                    onClick={() => markReportReviewed(report.id)}
                  >
                    Mark reviewed
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Reviewed</h2>
          <ul className="mt-3 grid gap-3">
            {reviewed.map((report) => {
              const student = studentById(report.studentId)
              return (
                <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 text-sm text-mute shadow-card ring-1 ring-black/[0.04]">
                  <span className="font-semibold text-ink">{student?.name ?? 'Student'}</span>
                  {' · '}
                  {report.reason}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
