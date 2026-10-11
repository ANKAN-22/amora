import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { useAdmin } from '@/admin/admin.ts'
import { listReports, markReportReviewed, setStudentStatus, type PersonRef, type ReviewReport } from '@/admin/review.ts'
import { runAccountAction } from '@/admin/userActions.ts'
import { bumpAdminData, useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatDateTime } from '@/admin/format.ts'
import { Empty, Loading, Modal, Notice, PageTitle, Pill, smallButton, smallDanger, smallSecondary, type NoticeState } from '@/admin/ui.tsx'

type Pending = { report: ReviewReport; kind: 'suspend' | 'ban' } | null

function person(label: string, who: PersonRef | null) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-wide text-mute uppercase">{label}</p>
      {who ? (
        <>
          <p className="font-bold break-words">{who.name}</p>
          <p className="text-sm break-all text-mute">{who.email}</p>
        </>
      ) : (
        <p className="text-sm text-mute">Account deleted</p>
      )}
    </div>
  )
}

export function AdminReportsPage() {
  usePageTitle('Reports')
  const version = useAdminDataVersion()
  const { userId: adminId } = useAdmin()
  const [reports, setReports] = useState<ReviewReport[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busyId, setBusyId] = useState('')
  const [pending, setPending] = useState<Pending>(null)
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const load = useCallback(async () => {
    try {
      setReports(await listReports())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  async function review(report: ReviewReport, action: string) {
    setBusyId(report.id)
    setNotice(null)
    try {
      await markReportReviewed(report.id, adminId, action)
      setNotice({ kind: 'success', text: 'Report marked as reviewed.' })
      bumpAdminData()
    } catch (err) {
      setNotice({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusyId('')
    }
  }

  async function moderate() {
    if (!pending?.report.target) return
    const { report, kind } = pending
    const target = report.target as PersonRef
    setDialogBusy(true)
    setDialogError('')
    try {
      if (kind === 'suspend') {
        await setStudentStatus(target.id, 'SUSPENDED', 'You can’t use Amora while this account is suspended.')
      } else {
        await runAccountAction('ban', target.id, { reason: `Report: ${report.reason}`.slice(0, 300) })
      }
      await markReportReviewed(report.id, adminId, kind === 'suspend' ? 'Suspended reported user' : 'Banned reported user')
      setPending(null)
      setNotice({ kind: 'success', text: `${target.name} was ${kind === 'suspend' ? 'suspended' : 'banned'} and the report was marked reviewed.` })
      bumpAdminData()
    } catch (err) {
      setDialogError(errorMessage(err))
    } finally {
      setDialogBusy(false)
    }
  }

  const open = (reports ?? []).filter((report) => !report.resolved)
  const reviewed = (reports ?? []).filter((report) => report.resolved)

  return (
    <div>
      <PageTitle title="Reports" subtitle="Reports sent from profiles and chats." />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Notice notice={error ? { kind: 'error', text: error } : null} />
      {!reports && !error ? <Loading /> : null}

      {reports ? (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Open ({open.length})</h2>
            {open.length === 0 ? <Empty>No open reports.</Empty> : null}
            <ul className="mt-3 grid gap-3">
              {open.map((report) => {
                const busy = busyId === report.id
                const canModerate = report.target && !report.target.isAdmin && report.target.accountStatus !== 'BANNED'
                return (
                  <li key={report.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {person('Reported user', report.target)}
                      {person('Reported by', report.reporter)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone="warn">{report.messageId ? 'Message' : 'Profile'}</Pill>
                      <span className="text-xs text-mute">{formatDateTime(report.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 break-words">
                      <span className="font-semibold">Reason: </span>
                      {report.reason}
                    </p>
                    {report.messageBody ? (
                      <p className="mt-2 rounded-2xl bg-[#fff5f7] px-3 py-2 text-sm break-words text-ink">“{report.messageBody}”</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={busy} className={`${smallButton} bg-coral text-white hover:bg-coral-deep`} onClick={() => void review(report, 'No action needed')}>
                        Mark reviewed
                      </button>
                      {canModerate ? (
                        <>
                          <button type="button" disabled={busy} className={smallSecondary} onClick={() => setPending({ report, kind: 'suspend' })}>
                            Suspend user
                          </button>
                          <button type="button" disabled={busy} className={smallSecondary} onClick={() => setPending({ report, kind: 'ban' })}>
                            Ban user
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {reviewed.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-bold tracking-wide text-mute uppercase">Reviewed ({reviewed.length})</h2>
              <ul className="mt-3 grid gap-3">
                {reviewed.map((report) => (
                  <li key={report.id} className="rounded-[1.4rem] bg-white px-4 py-3 text-sm text-mute shadow-card ring-1 ring-black/[0.04]">
                    <span className="font-semibold text-ink">{report.target?.name ?? 'Deleted account'}</span> · reported by {report.reporter?.name ?? 'deleted account'} · {report.reason}
                    <span className="block text-xs">
                      Reported {formatDateTime(report.createdAt)} · Reviewed {formatDateTime(report.reviewedAt)}
                      {report.actionTaken ? ` · ${report.actionTaken}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-4 text-mute">Reports cannot be deleted. The database gives admins no delete permission on reports, so they stay as a moderation record.</p>
            </section>
          ) : null}
        </>
      ) : null}

      {pending && pending.report.target ? (
        <Modal title={pending.kind === 'suspend' ? 'Suspend reported user?' : 'Ban reported user?'} onClose={() => setPending(null)} busy={dialogBusy}>
          <p className="text-sm leading-5">
            <span className="font-bold">{pending.report.target.name}</span> ({pending.report.target.email}) will be {pending.kind === 'suspend' ? 'suspended' : 'banned and blocked from logging in'}. This report will be marked reviewed.
          </p>
          {dialogError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {dialogError}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={smallSecondary} disabled={dialogBusy} onClick={() => setPending(null)}>
              Cancel
            </button>
            <button type="button" className={smallDanger} disabled={dialogBusy} onClick={() => void moderate()}>
              {pending.kind === 'suspend' ? 'Suspend' : 'Ban'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
