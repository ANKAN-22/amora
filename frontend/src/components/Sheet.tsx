import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type SheetProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, onClose, children }: SheetProps) {
  const frame = document.getElementById('amora-frame')
  if (!frame) return null

  return createPortal(
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rounded-t-[1.75rem] bg-white px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-3 max-h-[min(24rem,60dvh)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
      </div>
    </div>,
    frame,
  )
}
