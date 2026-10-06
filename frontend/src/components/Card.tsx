import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-[1.6rem] bg-white shadow-card ring-1 ring-black/[0.04] ${className}`}
      {...props}
    />
  )
}
