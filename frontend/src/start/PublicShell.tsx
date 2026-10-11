import { Outlet } from 'react-router-dom'
import { PhoneFrame } from '@/shared/PhoneFrame.tsx'

export function PublicShell() {
  return (
    <PhoneFrame>
      <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Outlet />
      </main>
    </PhoneFrame>
  )
}
