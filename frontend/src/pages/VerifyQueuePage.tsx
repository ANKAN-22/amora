import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { clearSession, hasSession, readAccount } from '@/lib/account.ts'

export function VerifyQueuePage() {
  usePageTitle('Verification')
  const navigate = useNavigate()
  const account = readAccount()

  if (!hasSession() || !account) return <Navigate to="/login" replace />

  function logOut() {
    clearSession()
    navigate('/')
  }

  return (
    <div className="px-5 pt-6 pb-8">
      <Link to="/" className="text-sm font-semibold text-mute">
        Home
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-wide text-mute uppercase">Verification</p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">You’re in the queue</h1>
      <p className="mt-2 text-sm leading-6 text-mute">
        An admin still needs to confirm you’re enrolled. Discover stays closed until then.
      </p>

      <div className="mt-6 rounded-[1.6rem] bg-blush px-4 py-4">
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-coral">
          Pending
        </span>
        <p className="mt-3 text-lg font-extrabold">{account.name}</p>
        <p className="mt-1 text-sm text-mute">
          {account.department} · {account.year}
        </p>
        <p className="mt-1 text-sm text-mute">Student ID {account.studentId}</p>
      </div>

      <Button className="mt-6" fullWidth variant="secondary" onClick={logOut}>
        Log out
      </Button>
    </div>
  )
}
