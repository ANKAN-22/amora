import { ArrowLeft, Heart, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MatchOverlay } from '@/components/MatchOverlay.tsx'
import { Pill } from '@/components/Pill.tsx'
import { studentById } from '@/data/students.ts'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { isMatched, likeStudent, passStudent, useSocial } from '@/lib/social.ts'

export function StudentPage() {
  const { studentId = '' } = useParams()
  const student = studentById(studentId)
  usePageTitle(student ? student.name : 'Profile')
  const navigate = useNavigate()
  const social = useSocial()
  const [match, setMatch] = useState<{ name: string; matchId: string } | null>(null)

  if (!student || social.blocks.includes(student.id)) {
    return <Navigate to="/discover" replace />
  }

  const matched = isMatched(student.id, social)
  const liked = social.liked.includes(student.id)
  const passed = social.passed.includes(student.id)
  const matchRecord = social.matches.find((item) => item.studentId === student.id)

  function like() {
    const result = likeStudent(student!.id)
    if (!result.matched || !result.matchId) return
    setMatch({ name: student!.name, matchId: result.matchId })
  }

  return (
    <div className="pb-8">
      <div className="relative h-72 overflow-hidden" style={{ background: student.background }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_46%)]" />
        <button
          type="button"
          aria-label="Back"
          className="absolute top-4 left-4 grid size-10 place-items-center rounded-full bg-white/90 text-ink"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-5 pt-16 pb-5 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {student.name}, {student.age}
          </h1>
          <p className="mt-1 text-sm text-white/85">
            {student.department} · {student.year}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="text-sm leading-6 text-ink">{student.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {student.interests.map((interest) => (
            <Pill key={interest}>{interest}</Pill>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {student.prompts.map((prompt) => (
            <article key={prompt.question} className="rounded-[1.4rem] bg-blush px-4 py-3">
              <p className="text-xs font-semibold text-mute">{prompt.question}</p>
              <p className="mt-1 text-sm leading-5 font-semibold">{prompt.answer}</p>
            </article>
          ))}
        </div>

        {matched && matchRecord ? (
          <button
            type="button"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-coral text-[15px] font-semibold text-white"
            onClick={() => navigate(`/chat/${matchRecord.id}`)}
          >
            Message {student.name.split(' ')[0]}
          </button>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-5">
            {passed || liked ? null : (
              <button
                type="button"
                aria-label={`Pass on ${student.name}`}
                className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-soft ring-1 ring-black/5"
                onClick={() => passStudent(student.id)}
              >
                <X className="size-6" strokeWidth={2.4} />
              </button>
            )}
            {liked ? (
              <p className="text-sm font-semibold text-mute">You liked {student.name.split(' ')[0]}</p>
            ) : (
              <button
                type="button"
                aria-label={`Like ${student.name}`}
                className="grid size-16 place-items-center rounded-full bg-ink text-white shadow-soft"
                onClick={like}
              >
                <Heart className="size-7" fill="currentColor" />
              </button>
            )}
          </div>
        )}
      </div>

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
