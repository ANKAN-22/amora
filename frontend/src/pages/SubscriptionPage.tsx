import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'

export function SubscriptionPage() {
  usePageTitle('Subscription')

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/settings" title="Subscription" subtitle="Matching and chat stay free." />
      <article className="mt-5 rounded-[1.6rem] bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
        <p className="text-xs font-semibold tracking-wide text-mute uppercase">Current plan</p>
        <h2 className="mt-1 text-lg font-bold">Free</h2>
        <p className="mt-2 text-sm leading-5 text-mute">
          You can like, match, and message without paying. Premium is not available in this version.
        </p>
      </article>
    </div>
  )
}
