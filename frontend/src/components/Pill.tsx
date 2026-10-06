import type { HTMLAttributes } from 'react'

type PillProps = HTMLAttributes<HTMLSpanElement>

export function Pill({ className = '', ...props }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink ${className}`}
      {...props}
    />
  )
}
