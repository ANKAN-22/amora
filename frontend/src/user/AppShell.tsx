import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/shared/BottomNav.tsx'
import { BrandMark } from '@/shared/BrandMark.tsx'
import { PhoneFrame } from '@/shared/PhoneFrame.tsx'
import { useSession } from '@/lib/account.ts'
import { profileProgress } from '@/lib/profile.ts'

export function AppShell() {
  const { pathname } = useLocation()
  const session = useSession()
  const account = session.account
  if (!account) {
    return <Navigate to="/login" replace />
  }

  if (account.verificationStatus !== 'APPROVED') {
    return <Navigate to="/verify" replace />
  }

  if (!session.profile || !profileProgress(session.profile).complete) {
    return <Navigate to="/profile-setup" replace />
  }

  const inChat = pathname === '/matches' || pathname.startsWith('/chat/')
  if (inChat && account.age < 18) {
    return <Navigate to="/discover" replace />
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
