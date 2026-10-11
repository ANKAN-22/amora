import { useCallback, useEffect, useState } from 'react'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { listSubscriptions, updateSubscription, type SubscriptionRecord, type SubscriptionStatus } from '@/admin/billing.ts'
import { bumpAdminData, useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatDate, toDateInput } from '@/admin/format.ts'
import { Empty, inputClass, Loading, Modal, Notice, PageTitle, Pagination, Pill, smallButton, smallSecondary, type NoticeState } from '@/admin/ui.tsx'

const PAGE_SIZE = 12

function tone(sub: SubscriptionRecord) {
  if (sub.lapsed) return 'warn' as const
  if (sub.status === 'ACTIVE') return 'ok' as const
  return 'neutral' as const
}

export function AdminSubscriptionsPage() {
  usePageTitle('Subscriptions')
  const version = useAdminDataVersion()
  const [subs, setSubs] = useState<SubscriptionRecord[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<SubscriptionRecord | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE')
  const [expires, setExpires] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    try {
      setSubs(await listSubscriptions())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  function edit(sub: SubscriptionRecord) {
    setEditing(sub)
    setStatus(sub.status)
    setExpires(toDateInput(sub.expiresAt))
    setFormError('')
  }

  async function save() {
    if (!editing) return
    let expiresAt: string | null = null
    if (expires) {
      const date = new Date(`${expires}T23:59:59`)
      if (Number.isNaN(date.getTime())) {
        setFormError('Enter a valid expiry date.')
        return
      }
      expiresAt = date.toISOString()
    }
    if (status === 'ACTIVE' && expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      setFormError('An active subscription needs an expiry date in the future (or no expiry).')
      return
    }
    setBusy(true)
    setFormError('')
    try {
      await updateSubscription(editing.id, status, expiresAt)
      setEditing(null)
      setNotice({ kind: 'success', text: `Subscription for ${editing.userName} updated.` })
      bumpAdminData()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const total = subs?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = (subs ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <PageTitle title="Subscriptions" subtitle="Premium records from the subscriptions table." />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Notice notice={error ? { kind: 'error', text: `${error} If this mentions a missing table, run the admin migration SQL first.` } : null} />
      {!subs && !error ? <Loading /> : null}
      {subs && subs.length === 0 ? <Empty>No subscription records yet. Nothing is created here automatically.</Empty> : null}

      {visible.length > 0 ? (
        <>
          <ul className="mt-5 grid gap-3">
            {visible.map((sub) => (
              <li key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
                <div className="min-w-0">
                  <p className="font-bold break-words">{sub.userName}</p>
                  <p className="text-sm break-all text-mute">{sub.userEmail}</p>
                  <p className="mt-1 text-xs text-mute">
                    {sub.plan} · Started {formatDate(sub.startedAt)} · Expires {sub.expiresAt ? formatDate(sub.expiresAt) : 'never'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={tone(sub)}>{sub.lapsed ? 'Past expiry' : sub.status.charAt(0) + sub.status.slice(1).toLowerCase()}</Pill>
                  <button type="button" className={smallSecondary} onClick={() => edit(sub)}>
                    Update
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} pageCount={pageCount} total={total} onPage={setPage} />
        </>
      ) : null}

      {editing ? (
        <Modal title={`Update subscription · ${editing.userName}`} onClose={() => setEditing(null)} busy={busy}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Status</span>
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as SubscriptionStatus)}>
              <option value="ACTIVE">Active</option>
              <option value="CANCELED">Canceled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-semibold">Expiry date (leave empty for none)</span>
            <input type="date" className={inputClass} value={expires} onChange={(event) => setExpires(event.target.value)} />
          </label>
          {formError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {formError}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={smallSecondary} disabled={busy} onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className={`${smallButton} bg-coral text-white hover:bg-coral-deep`} disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
