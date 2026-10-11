type HeartMarkProps = {
  className?: string
}

export function HeartMark({ className = 'size-8' }: HeartMarkProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 40.6c-.6 0-1.2-.2-1.6-.6C14.2 32.6 6 25.4 6 17.4 6 12.1 10.2 8.2 15.4 8.2c3.1 0 5.6 1.4 7.4 3.8 1.8-2.4 4.3-3.8 7.4-3.8C35.4 8.2 40 12.1 40 17.4c0 8-8.2 15.2-16.4 22.6-.4.4-1 .6-1.6.6z"
      />
    </svg>
  )
}

type BrandMarkProps = {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  if (compact) {
    return (
      <span className="grid size-9 place-items-center rounded-full bg-blush text-coral">
        <HeartMark className="size-5" />
      </span>
    )
  }

  return (
    <span className="inline-flex flex-col items-center gap-3 text-coral">
      <HeartMark className="size-16" />
      <span className="text-[1.7rem] font-extrabold tracking-tight text-ink">Amora</span>
    </span>
  )
}
