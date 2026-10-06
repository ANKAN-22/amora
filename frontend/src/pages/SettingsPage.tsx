import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { Sheet } from '@/components/Sheet.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { clearAgeChoice } from '@/lib/ageGate.ts'
import { clearSession, deleteAccountData, readAccount, statusLabel } from '@/lib/account.ts'
import { clearSettings } from '@/lib/settings.ts'
import { clearSocial } from '@/lib/social.ts'

const links = [
  { to: '/settings/privacy', label: 'Privacy', hint: 'What your profile shows' },
  { to: '/settings/notifications', label: 'Notifications', hint: 'Counts on Likes and Matches' },
  { to: '/safety', label: 'Blocked users', hint: 'People you have blocked' },
  { to: '/verify', label: 'Verification status', hint: '' },
  { to: '/settings/subscription', label: 'Subscription', hint: 'Free plan' },
  { to: '/settings/help', label: 'Help and safety', hint: 'How reporting works' },
]

export function SettingsPage() {
  usePageTitle('Settings')
  const navigate = useNavigate()
  const account = readAccount()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function logOut() {
    clearSession()
    navigate('/login', { replace: true })
  }

  function removeAccount() {
    clearSocial()
    clearSettings()
    deleteAccountData()
    clearAgeChoice()
    navigate('/', { replace: true })
  }

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/profile" title="Settings" subtitle="Privacy and account" />

      <ul className="mt-5 overflow-hidden rounded-[1.6rem] bg-white shadow-card ring-1 ring-black/[0.04]">
        {links.map((link) => (
          <li key={link.to + link.label} className="border-b border-line last:border-b-0">
            <Link to={link.to} className="block px-4 py-3.5">
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="block text-xs text-mute">
                {link.label === 'Verification status' ? statusLabel(account?.verificationStatus ?? 'PENDING') : link.hint}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Button variant="secondary" fullWidth className="mt-5" onClick={logOut}>
        Log out
      </Button>
      <button
        type="button"
        className="mt-3 h-12 w-full text-sm font-semibold text-coral"
        onClick={() => setConfirmDelete(true)}
      >
        Delete account
      </button>

      {confirmDelete ? (
        <Sheet title="Delete your account?" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm leading-5 text-mute">
            Your profile, verification, likes, and chats on this browser are removed.
          </p>
          <Button fullWidth className="mt-4" onClick={removeAccount}>
            Delete account
          </Button>
        </Sheet>
      ) : null}
    </div>
  )
}
