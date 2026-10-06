import { Compass, Heart, MessageCircle, UserRound } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { incomingLikes, useSocial, visibleMatches } from '@/lib/social.ts'

const tabs = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/likes', label: 'Likes', icon: Heart },
  { to: '/matches', label: 'Matches', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const social = useSocial()
  const badges: Record<string, number> = {
    '/likes': incomingLikes(social).length,
    '/matches': visibleMatches(social).filter((match) => !match.seen).length,
  }

  return (
    <nav
      aria-label="Main"
      className="border-t border-line bg-white px-2 pt-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            to === '/matches'
              ? pathname === '/matches' || pathname.startsWith('/chat/')
              : to === '/discover'
                ? pathname === '/discover' || pathname.startsWith('/student/')
                : pathname === to
          const count = badges[to] ?? 0
          return (
            <li key={to}>
              <NavLink to={to} className="block" aria-current={active ? 'page' : undefined}>
                <span
                  className={`flex flex-col items-center gap-0.5 rounded-2xl py-1 text-[11px] font-semibold ${
                    active ? 'text-coral' : 'text-mute'
                  }`}
                >
                  <span className={`relative grid size-9 place-items-center rounded-full ${active ? 'bg-blush' : ''}`}>
                    <Icon
                      className="size-[22px]"
                      strokeWidth={active ? 2.4 : 1.8}
                      fill={label === 'Likes' && active ? 'currentColor' : 'none'}
                    />
                    {count > 0 ? (
                      <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] leading-4 font-bold text-white">
                        {count}
                      </span>
                    ) : null}
                  </span>
                  {label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
