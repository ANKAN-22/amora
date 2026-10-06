import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav.tsx'
import { BrandMark } from '@/components/BrandMark.tsx'
import { PhoneFrame } from '@/layouts/PhoneFrame.tsx'
import { hasSession, readAccount } from '@/lib/account.ts'
import { profileProgress, readProfile } from '@/lib/profile.ts'

export function AppShell() {
  const { pathname } = useLocation()
  const account = readAccount()
  if (!hasSession() || !account) {
    return <Navigate to="/login" replace />
  }

  if (account.verificationStatus !== 'APPROVED') {
    return <Navigate to="/verify" replace />
  }

  const profile = readProfile()
  if (!profile || !profileProgress(profile).complete) {
    return <Navigate to="/profile-setup" replace />
  }

  const chat = pathname.startsWith('/chat/')
  const immersive = chat || pathname.startsWith('/student/')

  return (
    <PhoneFrame>
      {immersive ? null : (
        <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center px-5 pt-4 pb-2">
          <BrandMark compact />
          <p className="text-center text-[17px] font-bold tracking-tight">Amora</p>
          <span />
        </header>
      )}
      <main
        className={`flex min-h-0 flex-1 flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          chat ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        <Outlet />
      </main>
      <BottomNav />
    </PhoneFrame>
  )
}
