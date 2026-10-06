import { Compass, Heart, MessageCircle, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/likes', label: 'Likes', icon: Heart },
  { to: '/matches', label: 'Matches', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="border-t border-line bg-white px-2 pt-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className="block">
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center gap-0.5 rounded-2xl py-1 text-[11px] font-semibold ${
                    isActive ? 'text-coral' : 'text-mute'
                  }`}
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full ${
                      isActive ? 'bg-blush' : ''
                    }`}
                  >
                    <Icon
                      className="size-[22px]"
                      strokeWidth={isActive ? 2.4 : 1.8}
                      fill={label === 'Likes' && isActive ? 'currentColor' : 'none'}
                    />
                  </span>
                  {label}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
