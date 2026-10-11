import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/Button.tsx'
import { ScreenshotField } from '@/shared/ScreenshotField.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import {
  type StudentAccount,
  type VerificationRequest,
  type VerificationStatus,
  clearSession,
  pathAfterLogin,
  submitEnrollmentProof,
  useSession,
} from '@/lib/account.ts'
import { compressImage } from '@/lib/image.ts'

const statusLabel: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RESUBMISSION_REQUIRED: 'More info',
  SUSPENDED: 'Suspended',
}

export function VerifyQueuePage() {
  usePageTitle('Verification')
  const navigate = useNavigate()
  const session = useSession()
  const account = session.account
  const proof = session.verification
  const [editing, setEditing] = useState(false)

  if (!account) return <Navigate to="/login" replace />

  const canRevise =
    account.verificationStatus === 'REJECTED' || account.verificationStatus === 'RESUBMISSION_REQUIRED'
  const showForm =
    (account.verificationStatus === 'PENDING' && !proof?.screenshot) || (editing && canRevise)

  function logOut() {
    void clearSession().then(() => navigate('/'))
  }

  if (showForm) {
    return (
      <ProofForm
        initialPreview={proof?.screenshot ?? ''}
        retrying={Boolean(proof?.screenshot)}
        onCancel={proof?.screenshot ? () => setEditing(false) : undefined}
        onSubmitted={() => setEditing(false)}
        onLogOut={logOut}
      />
    )
  }

  return (
    <StatusView
      account={account}
      proof={proof}
      onAction={() => {
        if (account.verificationStatus === 'APPROVED') {
          navigate(pathAfterLogin())
          return
        }
        setEditing(true)
      }}
      onLogOut={logOut}
    />
  )
}

function ProofForm({
  initialPreview,
  retrying,
  onCancel,
  onSubmitted,
  onLogOut,
}: {
  initialPreview: string
  retrying: boolean
  onCancel?: () => void
  onSubmitted: () => void
  onLogOut: () => void
}) {
  const [preview, setPreview] = useState(initialPreview)
  const [notice, setNotice] = useState('')
  const [reading, setReading] = useState(false)

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setReading(true)
    setNotice('')
    try {
      setPreview(await compressImage(file))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read that image.')
    } finally {
      setReading(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preview) {
      setNotice('Upload a screenshot of your current enrollment.')
      return
    }
    if (preview.startsWith('http')) {
      setNotice('Choose a new screenshot to submit.')
      return
    }

    const message = await submitEnrollmentProof(preview)
    if (message) {
      setNotice(message)
      return
    }
    onSubmitted()
  }

  return (
    <div className="px-5 pt-6 pb-8">
      {onCancel ? (
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-mute">
          Back
        </button>
      ) : (
        <Link to="/" className="text-sm font-semibold text-mute">
          Home
        </Link>
      )}
      <p className="mt-6 text-xs font-semibold tracking-wide text-mute uppercase">Campus verification</p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">
        {retrying ? 'Update your proof' : 'Prove you’re enrolled'}
      </h1>
      <ol className="mt-4 grid gap-2 text-sm leading-5 text-mute">
        <li>1. Log into your university portal.</li>
        <li>2. Take a screenshot that shows your current enrollment.</li>
        <li>3. Upload it here and submit.</li>
      </ol>

      <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
        <ScreenshotField preview={preview} reading={reading} onFile={onFile} />
        {notice ? (
          <p className="text-sm leading-5 text-coral-deep" role="alert">
            {notice}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={reading}>
          Submit
        </Button>
        <Button type="button" fullWidth variant="secondary" onClick={onLogOut}>
          Log out
        </Button>
      </form>
    </div>
  )
}

function StatusView({
  account,
  proof,
  onAction,
  onLogOut,
}: {
  account: StudentAccount
  proof: VerificationRequest | null
  onAction: () => void
  onLogOut: () => void
}) {
  const status = account.verificationStatus
  const note = proof?.reviewNote.trim()
  const action =
    status === 'APPROVED' ? 'Continue' : status === 'REJECTED' ? 'Retry' : status === 'RESUBMISSION_REQUIRED' ? 'Resubmit' : ''

  const body =
    status === 'PENDING'
      ? 'An admin is reviewing your enrollment screenshot. Discover stays closed until you’re approved.'
      : status === 'APPROVED'
        ? 'Your enrollment is confirmed. You can continue into Amora.'
        : status === 'SUSPENDED'
          ? note || 'You can’t use Amora while this account is suspended.'
          : note || 'Upload a screenshot that clearly shows your current enrollment.'

  return (
    <div className="px-5 pt-6 pb-8">
      <Link to="/" className="text-sm font-semibold text-mute">
        Home
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-wide text-mute uppercase">Campus verification</p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">
        {status === 'PENDING'
          ? 'You’re in the queue'
          : status === 'APPROVED'
            ? 'You’re verified'
            : status === 'REJECTED'
              ? 'Proof declined'
              : status === 'RESUBMISSION_REQUIRED'
                ? 'More information needed'
                : 'Account suspended'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-mute">{body}</p>

      <div className="mt-6 rounded-[1.6rem] bg-blush px-4 py-4">
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-coral">
          {statusLabel[status]}
        </span>
        <p className="mt-3 text-lg font-extrabold">{account.name}</p>
        <p className="mt-1 text-sm text-mute">
          {account.department} · {account.year}
        </p>
        {proof?.screenshot ? (
          <img
            src={proof.screenshot}
            alt="Submitted enrollment screenshot"
            className="mt-4 h-36 w-full rounded-2xl object-cover"
          />
        ) : null}
      </div>

      {action ? (
        <Button className="mt-6" fullWidth onClick={onAction}>
          {action}
        </Button>
      ) : null}
      <Button className={action ? 'mt-3' : 'mt-6'} fullWidth variant="secondary" onClick={onLogOut}>
        Log out
      </Button>
    </div>
  )
}
