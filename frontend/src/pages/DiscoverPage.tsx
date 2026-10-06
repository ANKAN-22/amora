import { Heart, X } from 'lucide-react'
import { HeartMark } from '@/components/BrandMark.tsx'
import { PageHeading } from '@/components/PageHeading.tsx'
import { Pill } from '@/components/Pill.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'

export function DiscoverPage() {
  usePageTitle('Discover')

  return (
    <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-4">
      <div className="flex items-end justify-between gap-3">
        <PageHeading title="Discover" subtitle="Made for our campus" />
        <Pill>MAKAUT</Pill>
      </div>

      <article className="relative mt-4 min-h-[24rem] flex-1 overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#ffe3eb] via-[#ffc3d2] to-[#ff8fa6] shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,white,transparent_42%)]" />
        <div className="absolute top-[18%] left-1/2 grid size-28 -translate-x-1/2 place-items-center rounded-full bg-white/80 text-coral shadow-soft">
          <HeartMark className="size-14" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-5 pt-24 pb-24 text-white">
          <p className="text-xl font-bold">Campus profiles</p>
          <p className="mt-1 text-sm text-white/85">Verified students will appear here.</p>
        </div>
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-5" aria-hidden="true">
          <span className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-soft">
            <X className="size-6" strokeWidth={2.4} />
          </span>
          <span className="grid size-16 place-items-center rounded-full bg-ink text-white shadow-soft">
            <Heart className="size-7" fill="currentColor" />
          </span>
        </div>
      </article>
    </div>
  )
}
