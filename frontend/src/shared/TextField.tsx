import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextField({ label, id, className = '', ...props }: TextFieldProps) {
  const fieldId = id ?? props.name

  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <input
        id={fieldId}
        className={`h-12 w-full rounded-2xl bg-[#fff5f7] px-4 text-sm text-ink outline-none ring-1 ring-black/5 transition placeholder:text-mute focus:bg-white focus:ring-coral ${className}`}
        {...props}
      />
    </label>
  )
}
