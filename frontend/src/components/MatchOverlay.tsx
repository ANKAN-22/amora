import { createPortal } from 'react-dom'
import { Button } from '@/components/Button.tsx'
import { HeartMark } from '@/components/BrandMark.tsx'

type MatchOverlayProps = {
  name: string
  onMessage: () => void
  onClose: () => void
  closeLabel?: string
}

export function MatchOverlay({ name, onMessage, onClose, closeLabel = 'Keep discovering' }: MatchOverlayProps) {
  const frame = document.getElementById('amora-frame')
  if (!frame) return null

  return createPortal(
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#ff8fa6] to-[#e25b78] px-8 text-center text-white">
      <span className="grid size-24 place-items-center rounded-full bg-white/20">
        <HeartMark className="size-12 text-white" />
      </span>
      <h2 className="mt-6 text-3xl font-extrabold tracking-tight">It’s a match</h2>
      <p className="mt-2 max-w-[16rem] text-sm leading-5 text-white/90">You and {name} liked each other.</p>
      <Button variant="secondary" fullWidth className="mt-8" onClick={onMessage}>
        Send a message
      </Button>
      <button type="button" className="mt-4 text-sm font-semibold text-white" onClick={onClose}>
        {closeLabel}
      </button>
    </div>,
    frame,
  )
}
