import { MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { Card } from '@/components/Card.tsx'
import { PageHeading } from '@/components/PageHeading.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'

export function MatchesPage() {
  usePageTitle('Matches')
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-6">
      <PageHeading title="Matches" subtitle="Conversations start with a mutual like." />
      <Card className="mt-5 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-blush text-coral">
          <MessageCircle className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold">No matches yet</h2>
        <p className="mt-1 max-w-[16rem] text-sm leading-5 text-mute">
          When you both like each other, the chat opens here.
        </p>
        <Button className="mt-5" onClick={() => navigate('/discover')}>
          Discover people
        </Button>
      </Card>
    </div>
  )
}
