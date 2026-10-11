import { useState, type ReactNode } from 'react'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { statusLabel } from '@/lib/account.ts'
import { runAccountAction } from '@/admin/userActions.ts'
import { errorMessage, formatDate, formatDateTime } from '@/admin/format.ts'
import { accountState, type AdminUser } from '@/admin/review.ts'
import { inputClass, Modal, Pill, smallDanger, smallSecondary } from '@/admin/ui.tsx'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-line py-2 text-sm last:border-0">
      <dt className="text-mute">{label}</dt>
      <dd className="font-medium break-words">{children || '—'}</dd>
    </div>
  )
}

export function UserDetailsDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const state = accountState(user)
  return (
    <Modal title={user.name} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {user.isAdmin ? <Pill tone="brand">Admin</Pill> : null}
        <Pill tone={user.verificationStatus === 'APPROVED' ? 'ok' : user.verificationStatus === 'PENDING' ? 'warn' : 'neutral'}>
          {statusLabel(user.verificationStatus)}
        </Pill>
        <Pill tone={state === 'ACTIVE' ? 'ok' : 'bad'}>{state === 'ACTIVE' ? 'Active' : state === 'BANNED' ? 'Banned' : 'Suspended'}</Pill>
        {user.premiumActive ? <Pill tone="brand">Premium</Pill> : null}
      </div>
      <dl className="mt-4">
        <Row label="Email">{user.email}</Row>
        <Row label="Registered">{formatDateTime(user.createdAt)}</Row>
        <Row label="Student ID">{user.studentId}</Row>
        <Row label="Department">{user.department}</Row>
        <Row label="Year">{user.year}</Row>
        <Row label="Age">{user.age ? String(user.age) : ''}</Row>
        <Row label="Gender">{user.gender}</Row>
        <Row label="Bio">{user.bio}</Row>
        <Row label="Proof submitted">{formatDateTime(user.submittedAt)}</Row>
        <Row label="Review note">{user.reviewNote}</Row>
        <Row label="Premium until">{user.premiumActive ? (user.premiumExpiresAt ? formatDate(user.premiumExpiresAt) : 'No expiry') : ''}</Row>
        {state === 'BANNED' ? <Row label="Ban reason">{user.banReason}</Row> : null}
      </dl>
    </Modal>
  )
}

export function BanDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: (message: string) => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const result = await runAccountAction('ban', user.id, { reason })
      onDone(`${user.name} was banned.${result.warnings.length ? ` Note: ${result.warnings.join(' ')}` : ''}`)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="Ban this account?" onClose={onClose} busy={busy}>
      <p className="text-sm leading-5">
        <span className="font-bold">{user.name}</span> ({user.email}) will be signed out of new sessions, blocked from logging in, and hidden from
        other students. You can unban the account later.
      </p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Reason (internal, optional)</span>
        <input className={inputClass} value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} />
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={smallSecondary} disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={smallDanger} disabled={busy} onClick={() => void submit()}>
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : null} Ban account
        </button>
      </div>
    </Modal>
  )
}

export function DeleteAccountDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: (message: string) => void }) {
  const [typed, setTyped] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const matches = typed.trim().toLowerCase() === user.email.trim().toLowerCase()

  async function submit() {
    if (!matches || !understood) return
    setBusy(true)
    setError('')
    try {
      const result = await runAccountAction('delete', user.id, { confirmEmail: typed.trim() })
      onDone(`${user.name} (${user.email}) was permanently deleted.${result.warnings.length ? ` Note: ${result.warnings.join(' ')}` : ''}`)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="Permanently delete account" onClose={onClose} busy={busy}>
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-3.5 py-3 text-red-800">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <p className="text-sm leading-5">This cannot be undone. The login, profile, photos, enrollment screenshot, likes, matches and messages are removed.</p>
      </div>
      <dl className="mt-4 rounded-2xl bg-[#fff5f7] px-4 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-mute">Name</dt>
          <dd className="font-bold break-words">{user.name}</dd>
        </div>
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-mute">Email</dt>
          <dd className="font-bold break-all">{user.email}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-4 text-mute">
        Payment records are kept for financial and audit purposes and are detached from this person (their link to the account is removed).
      </p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Type the account’s email to confirm</span>
        <input
          className={inputClass}
          value={typed}
          autoComplete="off"
          spellCheck={false}
          placeholder={user.email}
          disabled={busy}
          onChange={(event) => setTyped(event.target.value)}
        />
      </label>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={understood} disabled={busy} onChange={(event) => setUnderstood(event.target.checked)} />
        <span>I understand this deletion is permanent.</span>
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-sm break-words text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={smallSecondary} disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={smallDanger} disabled={busy || !matches || !understood} onClick={() => void submit()}>
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : null} {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div>
    </Modal>
  )
}
