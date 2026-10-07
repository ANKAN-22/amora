import { Heart, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { Card } from '@/components/Card.tsx'
import { MatchOverlay } from '@/components/MatchOverlay.tsx'
import { PageHeading } from '@/components/PageHeading.tsx'
import { Pill } from '@/components/Pill.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { useSession } from '@/lib/account.ts'
import { portraitStyle } from '@/lib/people.ts'
import { fitsPreferences, isOpen, likeStudent, passStudent, useSocial } from '@/lib/social.ts'

export function DiscoverPage() {
  usePageTitle('Discover')
  const navigate = useNavigate()
  const social = useSocial()
  const profile = useSession().profile
  const [match, setMatch] = useState<{ name: string; matchId: string } | null>(null)

  const open = social.directory.filter((student) => isOpen(student, social))
  const deck = profile ? open.filter((student) => fitsPreferences(student, profile)) : []
  const student = deck[0] ?? null

  async function like(person: { id: string; name: string }) {
    const result = await likeStudent(person.id)
    if (!result.matched || !result.matchId) return
    setMatch({ name: person.name, matchId: result.matchId })
  }

  if (!social.ready) {
    return <p className="px-5 pt-6 text-sm text-mute">Loading students…</p>
  }

  return (
    <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-4">
      <div className="flex items-end justify-between gap-3">
        <PageHeading title="Discover" subtitle="Made for our campus" />
        <Pill>MAKAUT</Pill>
      </div>

      {student ? (
        <article
          className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[1.75rem] shadow-card"
          style={portraitStyle(student)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.5),transparent_42%)]" />
          <p className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink">
            {student.year}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-5 pt-28 pb-24 text-white">
            <button
              type="button"
              className="text-left"
              aria-label={`View ${student.name}'s profile`}
              onClick={() => navigate(`/student/${student.id}`)}
            >
              <p className="text-2xl font-extrabold tracking-tight">
                {student.name}, {student.age}
              </p>
              <p className="mt-1 text-sm text-white/85">{student.department}</p>
              <p className="mt-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4">
                View profile
              </p>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {student.interests.slice(0, 3).map((interest) => (
                <span key={interest} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label={`Pass on ${student.name}`}
              className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-soft"
              onClick={() => passStudent(student.id)}
            >
              <X className="size-6" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              aria-label={`Like ${student.name}`}
              className="grid size-16 place-items-center rounded-full bg-ink text-white shadow-soft"
              onClick={() => like(student)}
            >
              <Heart className="size-7" fill="currentColor" />
            </button>
          </div>
        </article>
      ) : (
        <Card className="mt-4 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <h2 className="text-lg font-bold">{open.length > 0 ? 'No one fits right now' : 'You’re all caught up'}</h2>
          <p className="mt-1 max-w-[16rem] text-sm leading-5 text-mute">
            {open.length > 0
              ? 'Widen your age range or who you’re looking for, and more students will show up here.'
              : 'New students will show up here. Anyone who already liked you is waiting in Likes.'}
          </p>
          <Button
            className="mt-5"
            onClick={() => navigate(open.length > 0 ? '/profile-setup' : '/likes')}
          >
            {open.length > 0 ? 'Edit preferences' : 'See likes'}
          </Button>
        </Card>
      )}

      {match ? (
        <MatchOverlay
          name={match.name}
          onMessage={() => navigate(`/chat/${match.matchId}`)}
          onClose={() => setMatch(null)}
        />
      ) : null}
    </div>
  )
}
