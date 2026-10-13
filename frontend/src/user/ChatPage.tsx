import { ArrowLeft, Flag, MoreHorizontal, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/Button.tsx'
import { ReportReasonList } from '@/shared/ReportReasonList.tsx'
import { Sheet } from '@/shared/Sheet.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import {
  blockStudent,
  deleteConversation,
  markMatchSeen,
  messagesFor,
  personById,
  reportStudent,
  sendMessage,
  unmatch,
  useSocial,
  type ReportReason,
} from '@/lib/social.ts'

type SheetMode = 'menu' | 'report-user' | 'report-message' | 'unmatch' | 'block' | 'delete' | 'saved' | null

export function ChatPage() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const social = useSocial()
  const match = social.matches.find((item) => item.id === matchId) ?? null
  const student = match ? personById(match.studentId) : null
  usePageTitle(student ? student.name : 'Chat')

  const [draft, setDraft] = useState('')
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [reportMessageId, setReportMessageId] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const messages = messagesFor(matchId, social)

  useEffect(() => {
    markMatchSeen(matchId)
  }, [matchId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (!social.ready) return <p className="px-5 pt-8 text-sm text-mute">Loading…</p>

  if (!match || !student || social.blocks.includes(student.id) || social.blockedBy.includes(student.id)) {
    return <Navigate to="/matches" replace />
  }

  async function submitMessage() {
    if (await sendMessage(matchId, draft)) setDraft('')
  }

  function fileReport(reason: ReportReason) {
    reportStudent({
      studentId: student!.id,
      matchId,
      messageId: sheet === 'report-message' ? reportMessageId : undefined,
      reason,
    })
    setSheet('saved')
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <button
          type="button"
          aria-label="Back to matches"
          className="grid size-10 place-items-center rounded-full text-ink"
          onClick={() => navigate('/matches')}
        >
          <ArrowLeft className="size-5" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/student/${student.id}`)}>
          <span className="block truncate font-bold">{student.name}</span>
          <span className="block truncate text-xs text-mute">{student.department}</span>
        </button>
        <button
          type="button"
          aria-label="Conversation options"
          className="grid size-10 place-items-center rounded-full text-ink"
          onClick={() => setSheet('menu')}
        >
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? (
          <p className="mx-auto mt-8 max-w-[16rem] text-center text-sm leading-5 text-mute">
            You matched with {student.name.split(' ')[0]}. Say hello.
          </p>
        ) : (
          <ul className="grid gap-2">
            {messages.map((message) => (
              <li key={message.id} className={message.from === 'me' ? 'flex justify-end' : 'flex items-end gap-1'}>
                <p
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    message.from === 'me' ? 'rounded-br-md bg-coral text-white' : 'rounded-bl-md bg-blush text-ink'
                  }`}
                >
                  {message.text}
                </p>
                {message.from === 'them' ? (
                  <button
                    type="button"
                    aria-label="Report message"
                    className="grid size-8 place-items-center rounded-full text-mute"
                    onClick={() => {
                      setReportMessageId(message.id)
                      setSheet('report-message')
                    }}
                  >
                    <Flag className="size-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-line px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault()
          submitMessage()
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="Message"
          aria-label="Message"
          className="h-12 min-w-0 flex-1 rounded-full bg-blush px-4 text-sm outline-none placeholder:text-mute"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={draft.trim().length === 0}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-white disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </form>

      {sheet === 'menu' ? (
        <Sheet title="Conversation" onClose={() => setSheet(null)}>
          <div className="grid gap-2">
            <Button variant="ghost" fullWidth onClick={() => setSheet('report-user')}>
              Report {student.name.split(' ')[0]}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setSheet('delete')}>
              Delete conversation
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setSheet('unmatch')}>
              Unmatch
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setSheet('block')}>
              Block
            </Button>
          </div>
        </Sheet>
      ) : null}

      {sheet === 'report-user' || sheet === 'report-message' ? (
        <Sheet
          title={sheet === 'report-message' ? 'Report this message' : `Report ${student.name.split(' ')[0]}`}
          onClose={() => setSheet(null)}
        >
          <ReportReasonList onPick={fileReport} />
        </Sheet>
      ) : null}

      {sheet === 'saved' ? (
        <Sheet title="Report saved" onClose={() => setSheet(null)}>
          <p className="text-sm leading-5 text-mute">A reviewer can see this report.</p>
          <Button fullWidth className="mt-4" onClick={() => setSheet(null)}>
            Done
          </Button>
        </Sheet>
      ) : null}

      {sheet === 'delete' ? (
        <Sheet title="Delete conversation?" onClose={() => setSheet(null)}>
          <p className="text-sm leading-5 text-mute">
            Every message with {student.name.split(' ')[0]} goes away. The match stays.
          </p>
          <Button
            fullWidth
            className="mt-4"
            onClick={() => {
              deleteConversation(matchId)
              setSheet(null)
            }}
          >
            Delete messages
          </Button>
        </Sheet>
      ) : null}

      {sheet === 'unmatch' ? (
        <Sheet title={`Unmatch ${student.name.split(' ')[0]}?`} onClose={() => setSheet(null)}>
          <p className="text-sm leading-5 text-mute">The conversation closes and they leave your matches.</p>
          <Button
            fullWidth
            className="mt-4"
            onClick={() => {
              unmatch(matchId)
              navigate('/matches', { replace: true })
            }}
          >
            Unmatch
          </Button>
        </Sheet>
      ) : null}

      {sheet === 'block' ? (
        <Sheet title={`Block ${student.name.split(' ')[0]}?`} onClose={() => setSheet(null)}>
          <p className="text-sm leading-5 text-mute">
            They disappear from Discover, Likes, and Matches.
          </p>
          <Button
            fullWidth
            className="mt-4"
            onClick={() => {
              blockStudent(student.id)
              navigate('/matches', { replace: true })
            }}
          >
            Block
          </Button>
        </Sheet>
      ) : null}
    </div>
  )
}
