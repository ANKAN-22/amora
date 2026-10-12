import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/Button.tsx'
import { Card } from '@/shared/Card.tsx'
import { MatchOverlay } from '@/shared/MatchOverlay.tsx'
import { PageHeading } from '@/shared/PageHeading.tsx'
import { Pill } from '@/shared/Pill.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { useSession } from '@/lib/account.ts'
import { type Person } from '@/lib/people.ts'
import { fitsPreferences, isOpen, likeStudent, passStudent, reloadSocial, useSocial } from '@/lib/social.ts'

function photoStyle(url: string | undefined, fallback: string): CSSProperties {
  if (!url) return { background: fallback }
  return {
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.35)), url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

export function DiscoverPage() {
  usePageTitle('Discover')
  const navigate = useNavigate()
  const social = useSocial()
  const profile = useSession().profile
  const [match, setMatch] = useState<{ name: string; matchId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const busyRef = useRef(false)
  const retryingRef = useRef(false)

  const open = social.directory.filter((student) => isOpen(student, social))
  const deck = profile ? open.filter((student) => fitsPreferences(student, profile)) : []
  const student = deck[0] ?? null
  const shownId = student?.id

  useEffect(() => {
    setPhotoIndex(0)
    setNotice('')
  }, [shownId])

  async function decide(kind: 'like' | 'pass', person: Person) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setNotice('')

    try {
      if (kind === 'pass') {
        const ok = await passStudent(person.id)
        if (!ok) setNotice(`Could not pass on ${person.name}. This profile is still here.`)
        return
      }

      const result = await likeStudent(person.id)
      if (result.failed) {
        setNotice(`Could not like ${person.name}. This profile is still here.`)
        return
      }
      if (result.matched && result.matchId) setMatch({ name: person.name, matchId: result.matchId })
    } catch {
      const verb = kind === 'pass' ? 'pass on' : 'like'
      setNotice(`Could not ${verb} ${person.name}. This profile is still here.`)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function retry() {
    if (retryingRef.current) return
    retryingRef.current = true
    setRetrying(true)
    try {
      await reloadSocial()
    } finally {
      retryingRef.current = false
      setRetrying(false)
    }
  }

  if (!social.ready) {
    return (
      <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-4">
        <PageHeading title="Discover" subtitle="Made for our campus" />
        <p className="px-1 pt-8 text-sm text-mute" role="status">
          Loading students…
        </p>
      </div>
    )
  }

  if (social.loadError && social.directory.length === 0) {
    return (
      <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-4">
        <PageHeading title="Discover" subtitle="Made for our campus" />
        <Card className="mt-4 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <h2 className="text-lg font-bold">Couldn’t load Discover</h2>
          <p className="mt-1 max-w-[16rem] text-sm leading-5 text-mute" role="alert">
            {social.loadError}
          </p>
          <Button className="mt-5" disabled={retrying} onClick={() => void retry()}>
            {retrying ? 'Trying again…' : 'Try again'}
          </Button>
        </Card>
      </div>
    )
  }

  const photos = student?.photoUrls ?? []
  const photo = photos[photoIndex] ?? photos[0]
  const prompts = student?.prompts.filter((item) => item.answer.trim()) ?? []

  return (
    <div className="flex min-h-full flex-1 flex-col px-5 pt-2 pb-4">
      <div className="flex items-end justify-between gap-3">
        <PageHeading title="Discover" subtitle="Made for our campus" />
        <Pill>MAKAUT</Pill>
      </div>

      {social.loadError ? (
        <p className="mt-3 text-sm leading-5 text-coral-deep" role="alert">
          {social.loadError}{' '}
          <button type="button" className="font-semibold underline" disabled={retrying} onClick={() => void retry()}>
            Try again
          </button>
        </p>
      ) : null}

      {student ? (
        <>
          <article className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-card">
            <div className="relative h-52 shrink-0 sm:h-60" style={photoStyle(photo, student.background)}>
              {student.year ? (
                <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink">
                  {student.year}
                </p>
              ) : null}
              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink"
                    onClick={() => setPhotoIndex((index) => (index - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink"
                    onClick={() => setPhotoIndex((index) => (index + 1) % photos.length)}
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <p className="absolute right-3 bottom-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {photoIndex + 1} / {photos.length}
                  </p>
                </>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <button
                type="button"
                className="text-left"
                aria-label={`View ${student.name}'s profile`}
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <p className="text-2xl font-extrabold tracking-tight">
                  {student.name}, {student.age}
                </p>
                <p className="mt-1 text-sm text-mute">{student.department}</p>
                <p className="mt-2 text-sm font-semibold text-coral">View profile</p>
              </button>

              {student.bio.trim() ? (
                <p className="mt-4 text-sm leading-6 text-ink">{student.bio}</p>
              ) : null}

              {prompts.length > 0 ? (
                <ul className="mt-4 grid gap-3">
                  {prompts.map((item) => (
                    <li key={item.question} className="border-t border-line pt-3">
                      <p className="text-xs font-semibold tracking-wide text-mute uppercase">{item.question}</p>
                      <p className="mt-1 text-sm leading-6">{item.answer}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {student.interests.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {student.interests.map((interest) => (
                    <li key={interest} className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink">
                      {interest}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>

          {notice ? (
            <p className="mt-2 text-center text-sm leading-5 text-coral-deep" role="alert">
              {notice}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label={`Pass on ${student.name}`}
              disabled={busy}
              className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-soft disabled:opacity-50"
              onClick={() => void decide('pass', student)}
            >
              <X className="size-6" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              aria-label={`Like ${student.name}`}
              disabled={busy}
              className="grid size-16 place-items-center rounded-full bg-ink text-white shadow-soft disabled:opacity-50"
              onClick={() => void decide('like', student)}
            >
              <Heart className="size-7" fill="currentColor" />
            </button>
          </div>
        </>
      ) : (
        <Card className="mt-4 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <h2 className="text-lg font-bold">{open.length > 0 ? 'No one fits right now' : 'You’re all caught up'}</h2>
          <p className="mt-1 max-w-[16rem] text-sm leading-5 text-mute">
            {open.length > 0
              ? 'Widen your age range or who you’re looking for, and more students will show up here.'
              : 'New students will show up here. Anyone who already liked you is waiting in Likes.'}
          </p>
          <Button className="mt-5" onClick={() => navigate(open.length > 0 ? '/profile-setup' : '/likes')}>
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
