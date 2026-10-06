import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { readAccount, readVerification, statusLabel, updateAccountStatus } from '@/lib/account.ts'

export function AdminVerificationPage() {
  usePageTitle('Verification')
  const [revision, setRevision] = useState(0)
  const account = readAccount()
  const proof = readVerification()
  const [note, setNote] = useState(proof?.reviewNote ?? '')
  const [saved, setSaved] = useState('')

  function apply(status: 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED', reviewNote: string) {
    const wrote = updateAccountStatus(status, reviewNote)
    if (!wrote) return
    setNote(reviewNote)
    setSaved(statusLabel(status))
    setRevision(revision + 1)
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Verification" subtitle="The enrollment screenshot on this browser." />
      {!account ? (
        <p className="mt-5 text-sm leading-5 text-mute">
          No student account yet.{' '}
          <Link to="/register" className="font-semibold text-coral">
            Create one
          </Link>{' '}
          from the student app, then come back here.
        </p>
      ) : (
        <div className="mt-5">
          <p className="text-lg font-extrabold">{account.name}</p>
          <p className="mt-1 text-sm text-mute">
            {account.department} · {account.year}
          </p>
          <p className="mt-1 text-sm text-mute">{account.email}</p>
          <p className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-bold text-coral">
            {statusLabel(account.verificationStatus)}
          </p>
          {proof?.screenshot ? (
            <img
              src={proof.screenshot}
              alt="Enrollment screenshot"
              className="mt-4 max-h-80 w-full rounded-[1.4rem] bg-white object-contain ring-1 ring-black/5"
            />
          ) : (
            <p className="mt-4 text-sm leading-5 text-mute">No enrollment screenshot yet.</p>
          )}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Note for the student</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl bg-[#fff5f7] px-4 py-3 text-sm outline-none ring-1 ring-black/5 focus:bg-white focus:ring-coral"
            />
          </label>
          {saved ? <p className="mt-3 text-sm font-semibold text-coral">Saved as {saved}.</p> : null}
          <div className="mt-4 grid gap-2">
            <Button fullWidth onClick={() => apply('APPROVED', '')}>
              Approve
            </Button>
            <Button fullWidth variant="secondary" onClick={() => apply('REJECTED', note.trim() || 'The screenshot doesn’t show current enrollment.')}>
              Decline
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() =>
                apply(
                  'RESUBMISSION_REQUIRED',
                  note.trim() || 'Upload a screenshot that shows your name and current enrollment.',
                )
              }
            >
              Ask for a new screenshot
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
