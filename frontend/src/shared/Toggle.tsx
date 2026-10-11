type ToggleProps = {
  checked: boolean
  label: string
  detail: string
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, label, detail, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-[1.4rem] bg-white px-4 py-3.5 text-left shadow-card ring-1 ring-black/[0.04]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-mute">{detail}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full ${checked ? 'bg-coral' : 'bg-line'}`}>
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow-soft ${checked ? 'right-1' : 'left-1'}`}
        />
      </span>
    </button>
  )
}
