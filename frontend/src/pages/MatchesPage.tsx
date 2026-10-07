import { MessageCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { Card } from '@/components/Card.tsx'
import { PageHeading } from '@/components/PageHeading.tsx'
import { StudentAvatar } from '@/components/StudentAvatar.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { lastMessage, personById, useSocial, visibleMatches } from '@/lib/social.ts'

function shortTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

export function MatchesPage() {
  usePageTitle('Matches')
  const navigate = useNavigate()
  const social = useSocial()
  const matches = visibleMatches(social)

  return (
    <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-6">
      <PageHeading title="Matches" subtitle="Conversations start with a mutual like." />

      {matches.length === 0 ? (
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
      ) : (
        <ul className="mt-5 grid gap-3">
          {matches.map((match) => {
            const student = personById(match.studentId)
            if (!student) return null
            const preview = lastMessage(match.id, social)
            return (
              <li key={match.id}>
                <Link
                  to={`/chat/${match.id}`}
                  className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-card ring-1 ring-black/[0.04]"
                >
                  <StudentAvatar student={student} className="size-12 text-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-bold">{student.name}</span>
                      {!match.seen ? (
                        <span className="rounded-full bg-blush px-2 py-0.5 text-[10px] font-bold tracking-wide text-coral uppercase">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-mute">
                      {preview ? (preview.from === 'me' ? `You: ${preview.text}` : preview.text) : 'It’s a match'}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-mute">{shortTime(preview?.createdAt ?? match.createdAt)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
