import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav.tsx'
import { BrandMark } from '@/components/BrandMark.tsx'

export function AppShell() {
  return (
    <div className="flex min-h-dvh justify-center bg-blush sm:items-center sm:py-6">
      <div className="flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white sm:h-[min(900px,calc(100dvh-3rem))] sm:rounded-[2rem] sm:shadow-[0_30px_80px_rgba(180,40,70,0.14)]">
        <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center px-5 pt-4 pb-2">
          <BrandMark compact />
          <p className="text-center text-[17px] font-bold tracking-tight">Amora</p>
          <span />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
