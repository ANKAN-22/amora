import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, CreditCard, Crown, Flag, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import { PhoneFrame } from '@/shared/PhoneFrame.tsx'
import { logoutAdmin, useAdmin } from '@/admin/admin.ts'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/verification', label: 'Verification', icon: BadgeCheck, end: false },
  { to: '/admin/reports', label: 'Reports', icon: Flag, end: false },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Crown, end: false },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, end: false },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1" aria-label="Admin">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-coral text-white shadow-soft' : 'text-ink hover:bg-blush'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const admin = useAdmin()
  const [menuOpen, setMenuOpen] = useState(false)
  const loginPath = pathname === '/admin/login'

  if (!admin.ready) {
    return (
      <PhoneFrame>
        <p className="px-6 py-10 text-sm text-mute">Loading…</p>
      </PhoneFrame>
    )
  }

  if (!admin.authed && !loginPath) return <Navigate to="/admin/login" replace />
  if (admin.authed && loginPath) return <Navigate to="/admin" replace />

  if (loginPath) {
    return (
      <PhoneFrame>
        <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Outlet />
        </main>
      </PhoneFrame>
    )
  }

  function logout() {
    void logoutAdmin().then(() => navigate('/admin/login', { replace: true }))
  }

  return (
    <div className="flex h-dvh bg-[#fbf6f8] text-ink">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <p className="px-2 text-xl font-extrabold tracking-tight text-coral">Amora</p>
        <p className="mt-0.5 px-2 text-xs font-semibold tracking-wide text-mute uppercase">Admin</p>
        <div className="mt-6 flex-1">
          <NavList />
        </div>
        <button type="button" onClick={logout} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-mute hover:bg-blush">
          <LogOut size={18} /> Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
          <p className="text-lg font-extrabold tracking-tight text-coral">Amora Admin</p>
          <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="rounded-full p-2 hover:bg-blush">
            <Menu size={22} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-12 sm:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white px-4 py-5 shadow-card">
            <div className="flex items-center justify-between px-2">
              <p className="text-xl font-extrabold tracking-tight text-coral">Amora</p>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 hover:bg-blush">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 flex-1">
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>
            <button type="button" onClick={logout} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-mute hover:bg-blush">
              <LogOut size={18} /> Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
