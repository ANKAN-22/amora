import { BadgeCheck, Settings, Shield, UserRound } from 'lucide-react'
import { Card } from '@/components/Card.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'

const rows = [
  { icon: UserRound, label: 'Edit profile', hint: 'Photos, bio, interests' },
  { icon: BadgeCheck, label: 'Verification', hint: 'Campus status' },
  { icon: Shield, label: 'Safety', hint: 'Block and report' },
  { icon: Settings, label: 'Settings', hint: 'Privacy and account' },
]

export function ProfilePage() {
  usePageTitle('Profile')

  return (
    <div className="pb-6">
      <div className="relative">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-coral to-[#ff9aab]">
          <div className="absolute -top-8 -right-6 size-36 rounded-full border border-white/30" />
          <div className="absolute top-6 right-12 size-16 rounded-full border border-white/25" />
        </div>
        <div className="absolute bottom-0 left-5 z-10 size-20 translate-y-1/2 rounded-full bg-white p-1 shadow-card">
          <div className="grid size-full place-items-center rounded-full bg-blush text-2xl font-extrabold text-coral">
            A
          </div>
        </div>
      </div>

      <div className="px-5 pt-12">
        <h1 className="text-xl font-extrabold tracking-tight">Your profile</h1>
        <p className="mt-0.5 text-sm text-mute">MAKAUT student</p>

        <Card className="mt-5 overflow-hidden">
          <ul>
            {rows.map((row) => {
              const Icon = row.icon
              return (
                <li
                  key={row.label}
                  className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-coral">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{row.label}</span>
                    <span className="block text-xs text-mute">{row.hint}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
