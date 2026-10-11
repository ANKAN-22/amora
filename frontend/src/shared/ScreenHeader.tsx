import { Link } from 'react-router-dom'

type ScreenHeaderProps = {
  backTo: string
  title: string
  subtitle?: string
}

export function ScreenHeader({ backTo, title, subtitle }: ScreenHeaderProps) {
  return (
    <div>
      <Link to={backTo} className="text-sm font-semibold text-mute">
        Back
      </Link>
      <h1 className="mt-4 text-[1.65rem] font-extrabold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm leading-5 text-mute">{subtitle}</p> : null}
    </div>
  )
}
