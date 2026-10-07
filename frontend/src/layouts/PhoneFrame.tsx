import type { ReactNode } from 'react'

type PhoneFrameProps = {
  children: ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-blush sm:items-center sm:py-6">
      <div
        id="amora-frame"
        className="relative flex h-dvh w-full max-w-[430px] touch-pan-y flex-col overflow-hidden overscroll-none bg-white sm:h-[min(900px,calc(100dvh-3rem))] sm:rounded-[2rem] sm:shadow-[0_30px_80px_rgba(180,40,70,0.14)]"
      >
        {children}
      </div>
    </div>
  )
}
