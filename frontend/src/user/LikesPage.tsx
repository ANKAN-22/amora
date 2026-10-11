import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MatchOverlay } from '@/shared/MatchOverlay.tsx'
import { PageHeading } from '@/shared/PageHeading.tsx'
import { StudentAvatar } from '@/shared/StudentAvatar.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { incomingLikes, likeStudent, outgoingLikes, personById, useSocial } from '@/lib/social.ts'

export function LikesPage() {
  usePageTitle('Likes')
  const navigate = useNavigate()
  const social = useSocial()
  const incoming = incomingLikes(social)
  const outgoing = outgoingLikes(social)
  const [match, setMatch] = useState<{ name: string; matchId: string } | null>(null)

  async function like(studentId: string) {
    const result = await likeStudent(studentId)
    if (!result.matched || !result.matchId) return
    const person = personById(studentId)
    if (person) setMatch({ name: person.name, matchId: result.matchId })
  }

  return (
    <div className="px-5 pt-2 pb-6">
      <PageHeading title="Likes" subtitle="People you notice, and people who notice you." />

      <section className="mt-5">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">People who liked you</h2>
        {incoming.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">When someone likes you, they show up here.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {incoming.map((student) => (
              <li key={student.id}>
                <article className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-card ring-1 ring-black/[0.04]">
                  <Link to={`/student/${student.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <StudentAvatar student={student} className="size-12 text-lg" />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {student.name}, {student.age}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-mute">{student.department}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="h-11 shrink-0 rounded-full bg-coral px-4 text-sm font-semibold text-white"
                    onClick={() => like(student.id)}
                  >
                    Like
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-wide text-mute uppercase">People you liked</h2>
        {outgoing.length === 0 ? (
          <p className="mt-2 text-sm leading-5 text-mute">No likes yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {outgoing.map((student) => (
              <li key={student.id}>
                <Link
                  to={`/student/${student.id}`}
                  className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-card ring-1 ring-black/[0.04]"
                >
                  <StudentAvatar student={student} className="size-12 text-lg" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {student.name}, {student.age}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-mute">Waiting for a like back</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {match ? (
        <MatchOverlay
          name={match.name}
          closeLabel="Keep browsing"
          onMessage={() => navigate(`/chat/${match.matchId}`)}
          onClose={() => setMatch(null)}
        />
      ) : null}
    </div>
  )
}
