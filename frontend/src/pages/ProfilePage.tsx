import { BadgeCheck, Settings, Shield, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { readAccount } from '@/lib/account.ts'
import { readProfile } from '@/lib/profile.ts'

const rows = [
  { icon: UserRound, label: 'Edit profile', hint: 'Photos, bio, interests', to: '/profile-setup' },
  { icon: BadgeCheck, label: 'Verification', hint: 'Approved', to: '/verify' },
  { icon: Shield, label: 'Safety', hint: 'Block and report', to: '' },
  { icon: Settings, label: 'Settings', hint: 'Privacy and account', to: '' },
]

export function ProfilePage() {
  usePageTitle('Profile')
  const account = readAccount()
  const profile = readProfile()
  const photo = profile?.photos[0]

  return (
    <div className="pb-8">
      <div className="relative">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-coral to-[#ff9aab]">
          <div className="absolute -top-8 -right-6 size-36 rounded-full border border-white/30" />
          <div className="absolute top-6 right-12 size-16 rounded-full border border-white/25" />
        </div>
        <div className="absolute bottom-0 left-5 z-10 size-20 translate-y-1/2 rounded-full bg-white p-1 shadow-card">
          {photo ? (
            <img src={photo} alt="" className="size-full rounded-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center rounded-full bg-blush text-2xl font-extrabold text-coral">
              {account?.name.slice(0, 1) ?? 'A'}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-12">
        <h1 className="text-xl font-extrabold tracking-tight">{account?.name ?? 'Your profile'}</h1>
        <p className="mt-0.5 text-sm text-mute">
          {profile?.department || 'MAKAUT'} · {profile?.year}
          {account?.age ? ` · ${account.age}` : ''}
        </p>
        {profile?.bio ? <p className="mt-3 text-sm leading-6">{profile.bio}</p> : null}
        {profile && profile.interests.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-blush px-3 py-1 text-xs font-semibold">
                {interest}
              </span>
            ))}
          </div>
        ) : null}

        <Card className="mt-5 overflow-hidden">
          <ul>
            {rows.map((row) => {
              const Icon = row.icon
              const content = (
                <>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-coral">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{row.label}</span>
                    <span className="block text-xs text-mute">{row.hint}</span>
                  </span>
                </>
              )
              return (
                <li key={row.label} className="border-b border-line last:border-b-0">
                  {row.to ? (
                    <Link to={row.to} className="flex items-center gap-3 px-4 py-3.5">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5">{content}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
