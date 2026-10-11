type PageHeadingProps = {
  title: string
  subtitle?: string
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-[1.65rem] font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm leading-5 text-mute">{subtitle}</p> : null}
    </div>
  )
}
