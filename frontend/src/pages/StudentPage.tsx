import { ArrowLeft, Heart, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { MatchOverlay } from '@/components/MatchOverlay.tsx'
import { Pill } from '@/components/Pill.tsx'
import { ReportReasonList } from '@/components/ReportReasonList.tsx'
import { Sheet } from '@/components/Sheet.tsx'
import { studentById } from '@/data/students.ts'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import {
  hideStudent,
  isMatched,
  likeStudent,
  passStudent,
  reportStudent,
  unhideStudent,
  useSocial,
  type ReportReason,
} from '@/lib/social.ts'

export function StudentPage() {
  const { studentId = '' } = useParams()
  const student = studentById(studentId)
  usePageTitle(student ? student.name : 'Profile')
  const navigate = useNavigate()
  const social = useSocial()
  const [match, setMatch] = useState<{ name: string; matchId: string } | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)

  if (!student || social.blocks.includes(student.id)) {
    return <Navigate to="/discover" replace />
  }

  const matched = isMatched(student.id, social)
  const liked = social.liked.includes(student.id)
  const passed = social.passed.includes(student.id)
  const matchRecord = social.matches.find((item) => item.studentId === student.id)

  const hidden = social.hidden.includes(student.id)

  function like() {
    const result = likeStudent(student!.id)
    if (!result.matched || !result.matchId) return
    setMatch({ name: student!.name, matchId: result.matchId })
  }

  function fileReport(reason: ReportReason) {
    reportStudent({
      studentId: student!.id,
      matchId: matchRecord?.id ?? '',
      reason,
    })
    setReporting(false)
    setReported(true)
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

        <div className="mt-5 flex justify-center gap-6 text-sm font-semibold">
          <button
            type="button"
            className="text-mute"
            onClick={() => (hidden ? unhideStudent(student.id) : hideStudent(student.id))}
          >
            {hidden ? 'Unhide' : 'Hide from Discover'}
          </button>
          <button type="button" className="text-coral" onClick={() => setReporting(true)}>
            Report
          </button>
        </div>
      </div>

      {reporting ? (
        <Sheet title={`Report ${student.name.split(' ')[0]}`} onClose={() => setReporting(false)}>
          <ReportReasonList onPick={fileReport} />
        </Sheet>
      ) : null}

      {reported ? (
        <Sheet title="Report saved" onClose={() => setReported(false)}>
          <p className="text-sm leading-5 text-mute">It’s stored with your account on this browser.</p>
          <Button fullWidth className="mt-4" onClick={() => setReported(false)}>
            Done
          </Button>
        </Sheet>
      ) : null}

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
