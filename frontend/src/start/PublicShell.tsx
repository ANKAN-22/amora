import { Outlet, useLocation } from 'react-router-dom'
import { PhoneFrame } from '@/shared/PhoneFrame.tsx'

export function PublicShell() {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return (
      <main className="h-dvh overflow-x-clip overflow-y-auto overscroll-contain bg-ivory text-ink">
        <Outlet />
      </main>
    )
  }

  return (
    <PhoneFrame>
      <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Outlet />
      </main>
    </PhoneFrame>
  )
}
