import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

const variantClass = {
  primary: 'bg-coral text-white shadow-soft hover:bg-coral-deep',
  secondary: 'bg-white text-ink ring-1 ring-black/5 hover:bg-blush',
  ghost: 'bg-transparent text-ink hover:bg-blush',
} as const

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
