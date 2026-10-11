import { useEffect, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react'
import { Card } from '@/shared/Card.tsx'

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'brand'

const toneClass: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  brand: 'bg-blush text-coral-deep',
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${toneClass[tone]}`}>
      {children}
    </span>
  )
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[1.65rem] font-extrabold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm leading-5 text-mute">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint, tone = 'neutral' }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-xs font-semibold tracking-wide text-mute uppercase">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${tone === 'bad' ? 'text-red-600' : ''}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs leading-4 text-mute">{hint}</p> : null}
    </Card>
  )
}

export type NoticeState = { kind: 'success' | 'error'; text: string } | null

export function Notice({ notice, onClose }: { notice: NoticeState; onClose?: () => void }) {
  if (!notice) return null
  const style = notice.kind === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-red-50 text-red-800 ring-red-100'
  return (
    <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${style}`}>
      <p className="leading-5 break-words">{notice.text}</p>
      {onClose ? (
        <button type="button" aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100" onClick={onClose}>
          <X size={16} />
        </button>
      ) : null}
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="mt-8 flex items-center gap-2 text-sm text-mute">
      <LoaderCircle size={16} className="animate-spin" /> {label}
    </p>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="mt-6 rounded-2xl bg-white px-4 py-6 text-center text-sm leading-5 text-mute ring-1 ring-black/[0.04]">{children}</p>
}

export function Pagination({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (page: number) => void }) {
  if (pageCount <= 1) return <p className="mt-4 text-xs text-mute">{total} total</p>
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <p className="text-xs text-mute">
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-black/5 hover:bg-blush disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-black/5 hover:bg-blush disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  busy?: boolean
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.6rem] bg-white p-5 shadow-card sm:rounded-[1.6rem]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <button type="button" aria-label="Close" disabled={busy} onClick={onClose} className="rounded-full p-1 text-mute hover:bg-blush disabled:opacity-40">
            <X size={18} />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

export const inputClass =
  'h-11 w-full rounded-2xl bg-[#fff5f7] px-3 text-sm text-ink outline-none ring-1 ring-black/5 transition placeholder:text-mute focus:bg-white focus:ring-coral'

export const smallButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:pointer-events-none disabled:opacity-50'

export const smallSecondary = `${smallButton} bg-white text-ink ring-1 ring-black/10 hover:bg-blush`
export const smallDanger = `${smallButton} bg-red-600 text-white hover:bg-red-700`
