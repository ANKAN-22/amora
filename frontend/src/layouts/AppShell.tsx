import { Navigate, Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav.tsx'
import { BrandMark } from '@/components/BrandMark.tsx'
import { PhoneFrame } from '@/layouts/PhoneFrame.tsx'
import { hasSession, readAccount } from '@/lib/account.ts'

export function AppShell() {
  const account = readAccount()
  if (hasSession() && account && account.verificationStatus !== 'APPROVED') {
    return <Navigate to="/verify" replace />
  }

  return (
    <PhoneFrame>
      <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center px-5 pt-4 pb-2">
        <BrandMark compact />
        <p className="text-center text-[17px] font-bold tracking-tight">Amora</p>
        <span />
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Outlet />
      </main>
      <BottomNav />
    </PhoneFrame>
  )
}
