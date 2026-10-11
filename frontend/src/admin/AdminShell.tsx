import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PhoneFrame } from '@/shared/PhoneFrame.tsx'
import { useAdmin } from '@/admin/admin.ts'

export function AdminShell() {
  const { pathname } = useLocation()
  const admin = useAdmin()
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

  return (
    <PhoneFrame>
      {loginPath ? null : (
        <header className="px-5 pt-4 pb-2 text-center">
          <p className="text-[17px] font-bold tracking-tight">Review</p>
        </header>
      )}
      <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Outlet />
      </main>
    </PhoneFrame>
  )
}
