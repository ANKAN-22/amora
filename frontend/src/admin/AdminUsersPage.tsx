import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, Eye, LoaderCircle, Pause, RotateCcw, Search, Trash2 } from 'lucide-react'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { statusLabel, type VerificationStatus } from '@/lib/account.ts'
import { useAdmin } from '@/admin/admin.ts'
import { accountState, listUsers, setStudentStatus, type AdminUser } from '@/admin/review.ts'
import { runAccountAction } from '@/admin/userActions.ts'
import { bumpAdminData, useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatDate } from '@/admin/format.ts'
import { BanDialog, DeleteAccountDialog, UserDetailsDialog } from '@/admin/UserDialogs.tsx'
import { Empty, inputClass, Loading, Notice, PageTitle, Pagination, Pill, smallDanger, smallSecondary, type NoticeState } from '@/admin/ui.tsx'

const PAGE_SIZE = 12

const verificationOptions: VerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'SUSPENDED']

type Dialog = { kind: 'details' | 'ban' | 'delete'; user: AdminUser } | null

export function AdminUsersPage() {
  usePageTitle('Users')
  const version = useAdminDataVersion()
  const { userId: selfId } = useAdmin()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busyId, setBusyId] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)

  const [search, setSearch] = useState('')
  const [verification, setVerification] = useState('')
  const [account, setAccount] = useState('')
  const [premium, setPremium] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (users ?? []).filter((user) => {
      if (needle && !`${user.name} ${user.email} ${user.studentId}`.toLowerCase().includes(needle)) return false
      if (verification && user.verificationStatus !== verification) return false
      if (account && accountState(user) !== account) return false
      if (premium === 'premium' && !user.premiumActive) return false
      if (premium === 'free' && user.premiumActive) return false
      return true
    })
  }, [users, search, verification, account, premium])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function run(user: AdminUser, task: () => Promise<string>) {
    setBusyId(user.id)
    setNotice(null)
    try {
      const message = await task()
      setNotice({ kind: 'success', text: message })
      bumpAdminData()
    } catch (err) {
      setNotice({ kind: 'error', text: errorMessage(err) })
    } finally {
      setBusyId('')
    }
  }

  function suspend(user: AdminUser) {
    void run(user, async () => {
      await setStudentStatus(user.id, 'SUSPENDED', 'You can’t use Amora while this account is suspended.')
      return `${user.name} was suspended.`
    })
  }

  function restore(user: AdminUser) {
    void run(user, async () => {
      await setStudentStatus(user.id, 'APPROVED', '')
      return `${user.name} was restored.`
    })
  }

  function unban(user: AdminUser) {
    void run(user, async () => {
      await runAccountAction('unban', user.id)
      return `${user.name} was unbanned.`
    })
  }

  function finished(message: string) {
    setDialog(null)
    setNotice({ kind: 'success', text: message })
  }

  function rowActions(user: AdminUser) {
    const busy = busyId === user.id
    const state = accountState(user)
    const isSelf = user.id === selfId
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={smallSecondary} onClick={() => setDialog({ kind: 'details', user })}>
          <Eye size={14} /> View
        </button>
        {user.isAdmin ? null : state === 'BANNED' ? (
          <button type="button" className={smallSecondary} disabled={busy} onClick={() => unban(user)}>
            <RotateCcw size={14} /> Unban
          </button>
        ) : (
          <>
            {state === 'SUSPENDED' ? (
              <button type="button" className={smallSecondary} disabled={busy} onClick={() => restore(user)}>
                <RotateCcw size={14} /> Restore
              </button>
            ) : (
              <button type="button" className={smallSecondary} disabled={busy} onClick={() => suspend(user)}>
                <Pause size={14} /> Suspend
              </button>
            )}
            <button type="button" className={smallSecondary} disabled={busy} onClick={() => setDialog({ kind: 'ban', user })}>
              <Ban size={14} /> Ban
            </button>
          </>
        )}
        <button
          type="button"
          className={`${smallDanger}`}
          disabled={busy || isSelf}
          title={isSelf ? 'You cannot delete your own account' : 'Permanently delete this account'}
          onClick={() => setDialog({ kind: 'delete', user })}
        >
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete Account
        </button>
      </div>
    )
  }

  function badges(user: AdminUser) {
    const state = accountState(user)
    return (
      <div className="flex flex-wrap gap-1.5">
        {user.isAdmin ? <Pill tone="brand">Admin</Pill> : null}
        <Pill tone={user.verificationStatus === 'APPROVED' ? 'ok' : user.verificationStatus === 'PENDING' ? 'warn' : 'neutral'}>
          {statusLabel(user.verificationStatus)}
        </Pill>
        {state !== 'ACTIVE' ? <Pill tone="bad">{state === 'BANNED' ? 'Banned' : 'Suspended'}</Pill> : null}
        {user.premiumActive ? <Pill tone="brand">Premium</Pill> : null}
      </div>
    )
  }

  return (
    <div>
      <PageTitle title="Users" subtitle="Every registered account." />
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Notice notice={error ? { kind: 'error', text: error } : null} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search by name, email or student ID</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search name, email, student ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </label>
        <select
          aria-label="Verification status"
          className={inputClass}
          value={verification}
          onChange={(event) => {
            setVerification(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All verification</option>
          {verificationOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <select
          aria-label="Account status"
          className={inputClass}
          value={account}
          onChange={(event) => {
            setAccount(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All accounts</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
        <select
          aria-label="Subscription status"
          className={inputClass}
          value={premium}
          onChange={(event) => {
            setPremium(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All subscriptions</option>
          <option value="premium">Premium (active)</option>
          <option value="free">No active premium</option>
        </select>
      </div>

      {!users && !error ? <Loading /> : null}
      {users && filtered.length === 0 ? <Empty>{users.length === 0 ? 'No accounts yet.' : 'No users match these filters.'}</Empty> : null}

      {visible.length > 0 ? (
        <>
          <div className="mt-5 hidden overflow-x-auto rounded-[1.6rem] bg-white shadow-card ring-1 ring-black/[0.04] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-mute uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold">{user.name}</p>
                      <p className="text-mute">{user.email}</p>
                      <p className="text-xs text-mute">
                        {[user.department, user.year].filter(Boolean).join(' · ') || 'No profile details'}
                      </p>
                    </td>
                    <td className="px-4 py-3">{badges(user)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-mute">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">{rowActions(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 lg:hidden">
            {visible.map((user) => (
              <article key={user.id} className="rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
                <p className="text-lg font-extrabold break-words">{user.name}</p>
                <p className="mt-0.5 text-sm break-all text-mute">{user.email}</p>
                <p className="mt-1 text-sm text-mute">
                  {[user.department, user.year].filter(Boolean).join(' · ') || 'No profile details'} · Joined {formatDate(user.createdAt)}
                </p>
                <div className="mt-3">{badges(user)}</div>
                <div className="mt-4">{rowActions(user)}</div>
              </article>
            ))}
          </div>

          <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
        </>
      ) : null}

      {dialog?.kind === 'details' ? <UserDetailsDialog user={dialog.user} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === 'ban' ? <BanDialog user={dialog.user} onClose={() => setDialog(null)} onDone={finished} /> : null}
      {dialog?.kind === 'delete' ? <DeleteAccountDialog user={dialog.user} onClose={() => setDialog(null)} onDone={finished} /> : null}
    </div>
  )
}

