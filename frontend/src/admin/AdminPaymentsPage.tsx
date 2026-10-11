import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { listPayments, successfulRevenue, type PaymentRecord } from '@/admin/billing.ts'
import { useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatDateTime, formatMoney } from '@/admin/format.ts'
import { Empty, Loading, Notice, PageTitle, Pagination, Pill, StatCard, type Tone } from '@/admin/ui.tsx'

const PAGE_SIZE = 15

const tones: Record<PaymentRecord['status'], Tone> = { SUCCEEDED: 'ok', PENDING: 'warn', FAILED: 'bad', REFUNDED: 'neutral' }

export function AdminPaymentsPage() {
  usePageTitle('Payments')
  const version = useAdminDataVersion()
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setPayments(await listPayments())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  const revenue = payments ? successfulRevenue(payments) : null
  const total = payments?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = (payments ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <PageTitle title="Payments" subtitle="Read-only. Payments are recorded by your payment backend, never by this panel." />
      <Notice notice={error ? { kind: 'error', text: `${error} If this mentions a missing table, run the admin migration SQL first.` } : null} />
      {!payments && !error ? <Loading /> : null}

      {revenue ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Successful payments" value={revenue.count} />
          <StatCard
            label="Successful revenue"
            value={revenue.totals.length > 0 ? revenue.totals.map((item) => formatMoney(item.minor, item.currency)).join(' + ') : '0'}
            hint="Only payments with status Succeeded"
          />
        </div>
      ) : null}

      {payments && payments.length === 0 ? <Empty>No payment records yet.</Empty> : null}

      {visible.length > 0 ? (
        <>
          <div className="mt-5 hidden overflow-x-auto rounded-[1.6rem] bg-white shadow-card ring-1 ring-black/[0.04] md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-mute uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Transaction</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((payment) => (
                  <tr key={payment.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3 font-mono text-xs break-all">{payment.transactionId}</td>
                    <td className="px-4 py-3">
                      {payment.userName ? (
                        <>
                          <p className="font-semibold">{payment.userName}</p>
                          <p className="text-xs text-mute">{payment.userEmail}</p>
                        </>
                      ) : (
                        <p className="text-xs text-mute">Deleted account{payment.payerRef ? ` · ref ${payment.payerRef}` : ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatMoney(payment.amountMinor, payment.currency)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-mute">{formatDateTime(payment.paidAt ?? payment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Pill tone={tones[payment.status]}>{payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}</Pill>
                    </td>
                    <td className="px-4 py-3 text-mute">{payment.method ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 grid gap-3 md:hidden">
            {visible.map((payment) => (
              <li key={payment.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-extrabold">{formatMoney(payment.amountMinor, payment.currency)}</p>
                  <Pill tone={tones[payment.status]}>{payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}</Pill>
                </div>
                <p className="mt-1 text-sm break-words">{payment.userName ?? `Deleted account${payment.payerRef ? ` · ref ${payment.payerRef}` : ''}`}</p>
                <p className="mt-1 font-mono text-xs break-all text-mute">{payment.transactionId}</p>
                <p className="mt-1 text-xs text-mute">
                  {formatDateTime(payment.paidAt ?? payment.createdAt)} · {payment.method ?? 'method not recorded'}
                </p>
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} pageCount={pageCount} total={total} onPage={setPage} />
        </>
      ) : null}
    </div>
  )
}
