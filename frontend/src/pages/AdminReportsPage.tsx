import { useEffect, useState } from 'react'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { listReports, markReportReviewed, type ReviewReport } from '@/lib/review.ts'

export function AdminReportsPage() {
  usePageTitle('Reports')
  const [reports, setReports] = useState<ReviewReport[]>([])

  async function load() {
    setReports(await listReports())
  }

  useEffect(() => {
    void load()
  }, [])

  const open = reports.filter((report) => !report.resolved)
  const reviewed = reports.filter((report) => report.resolved)

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Reports" subtitle="Reports sent from profiles and chats." />

      <section className="mt-5">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Open</h2>
        {open.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">No open reports.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {open.map((report) => (
              <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 shadow-card ring-1 ring-black/[0.04]">
                <p className="font-bold">{report.name}</p>
                <p className="mt-0.5 text-sm text-mute">
                  {report.reason}
                  {report.messageId ? ' · Message' : ' · Profile'}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-coral"
                  onClick={() => {
                    void markReportReviewed(report.id).then(load)
                  }}
                >
                  Mark reviewed
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Reviewed</h2>
          <ul className="mt-3 grid gap-3">
            {reviewed.map((report) => (
              <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 text-sm text-mute shadow-card ring-1 ring-black/[0.04]">
                <span className="font-semibold text-ink">{report.name}</span>
                {' · '}
                {report.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
