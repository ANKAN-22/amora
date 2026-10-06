import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { readAccount, statusLabel, updateAccountStatus } from '@/lib/account.ts'

export function AdminUsersPage() {
  usePageTitle('Users')
  const [revision, setRevision] = useState(0)
  const account = readAccount()

  function suspend() {
    updateAccountStatus('SUSPENDED', 'You can’t use Amora while this account is suspended.')
    setRevision(revision + 1)
  }

  function restore() {
    updateAccountStatus('APPROVED', '')
    setRevision(revision + 1)
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/admin" title="Users" subtitle="The one student account on this browser." />
      {!account ? (
        <p className="mt-5 text-sm leading-5 text-mute">
          No student account yet.{' '}
          <Link to="/register" className="font-semibold text-coral">
            Create one
          </Link>{' '}
          from the student app.
        </p>
      ) : (
        <article className="mt-5 rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
          <p className="text-lg font-extrabold">{account.name}</p>
          <p className="mt-1 text-sm text-mute">{account.email}</p>
          <p className="mt-1 text-sm text-mute">
            {account.department} · {account.year}
            {account.age ? ` · ${account.age}` : ''}
          </p>
          <p className="mt-1 text-sm text-mute">Student ID {account.studentId || 'not added'}</p>
          <p className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-bold text-coral">
            {statusLabel(account.verificationStatus)}
          </p>
          {account.verificationStatus === 'SUSPENDED' ? (
            <Button fullWidth className="mt-4" onClick={restore}>
              Restore access
            </Button>
          ) : (
            <Button fullWidth className="mt-4" variant="secondary" onClick={suspend}>
              Suspend
            </Button>
          )}
        </article>
      )}
    </div>
  )
}
