import { Link } from 'react-router-dom'
import { ScreenHeader } from '@/shared/ScreenHeader.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'

export function HelpPage() {
  usePageTitle('Help and safety')

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/settings" title="Help and safety" subtitle="Amora is for MAKAUT students who are 18 or older." />
      <div className="mt-5 grid gap-3 text-sm leading-6">
        <article className="rounded-[1.4rem] bg-blush px-4 py-3">
          <h2 className="font-bold">Report</h2>
          <p className="mt-1 text-mute">
            Open a profile or a chat and choose a reason. A reviewer can see the report.
          </p>
        </article>
        <article className="rounded-[1.4rem] bg-blush px-4 py-3">
          <h2 className="font-bold">Block</h2>
          <p className="mt-1 text-mute">Block removes someone from Discover, Likes, and Matches. You can unblock them from Safety.</p>
        </article>
        <article className="rounded-[1.4rem] bg-blush px-4 py-3">
          <h2 className="font-bold">Hide</h2>
          <p className="mt-1 text-mute">Hide removes someone from Discover only. Chats you already have stay open.</p>
        </article>
      </div>
      <Link to="/safety" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-semibold text-white">
        Open Safety
      </Link>
    </div>
  )
}
