import type { SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}

export function SelectField({ label, id, className = '', children, ...props }: SelectFieldProps) {
  const fieldId = id ?? props.name

  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <select
        id={fieldId}
        className={`h-12 w-full appearance-none rounded-2xl bg-[#fff5f7] px-4 text-sm text-ink outline-none ring-1 ring-black/5 transition focus:bg-white focus:ring-coral ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
