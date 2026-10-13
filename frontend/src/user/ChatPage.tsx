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
  loadOlderMessages,
  loadThread,
  markMatchSeen,
  messagesFor,
  subscribeMessages,
  personById,
  reportStudent,
  sendMessage,
  unmatch,
  useSocial,
  type ReportReason,
} from '@/lib/social.ts'
import { sameTimeGroup, shortTime } from '@/lib/time.ts'

type SheetMode = 'menu' | 'report-user' | 'report-message' | 'unmatch' | 'block' | 'delete' | 'saved' | null

export function ChatPage() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const social = useSocial()
  const match = social.matches.find((item) => item.id === matchId) ?? null
  const student = match ? personById(match.studentId) : null
  usePageTitle(student ? student.name : 'Chat')

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const sendingRef = useRef(false)
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [reportMessageId, setReportMessageId] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const messages = messagesFor(matchId, social)
  const newestId = messages[messages.length - 1]?.id ?? ''
  const latestIncomingId = messages.reduce((id, message) => (message.from === 'them' ? message.id : id), '')

  useEffect(() => subscribeMessages(), [matchId])

  useEffect(() => {
    void loadThread(matchId)
  }, [matchId])

  useEffect(() => {
    if (!match || match.seen) return
    markMatchSeen(matchId)
  }, [matchId, match, latestIncomingId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [newestId])

  useEffect(() => {
    const box = composerRef.current
    if (!box) return
    box.style.height = 'auto'
    box.style.height = `${Math.min(box.scrollHeight, 128)}px`
  }, [draft])

  if (!social.ready) return <p className="px-5 pt-8 text-sm text-mute">Loading…</p>

  if (!match || !student || social.blocks.includes(student.id) || social.blockedBy.includes(student.id)) {
    return <Navigate to="/matches" replace />
  }

  async function submitMessage() {
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setSendError('')
    const result = await sendMessage(matchId, draft)
    sendingRef.current = false
    setSending(false)
    if (result.ok) setDraft('')
    else if (result.message) setSendError(result.message)
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

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {social.threadOlder[matchId] ? (
          <button
            type="button"
            className="mx-auto mb-3 block text-xs font-semibold text-coral disabled:opacity-40"
            disabled={loadingOlder}
            onClick={() => {
              const scroller = listRef.current
              const before = scroller?.scrollHeight ?? 0
              setLoadingOlder(true)
              void loadOlderMessages(matchId).then(() => {
                setLoadingOlder(false)
                requestAnimationFrame(() => {
                  if (!scroller) return
                  scroller.scrollTop += scroller.scrollHeight - before
                })
              })
            }}
          >
            {loadingOlder ? 'Loading…' : 'Load older messages'}
          </button>
        ) : null}
        {messages.length === 0 ? (
          <p className="mx-auto mt-8 max-w-[16rem] text-center text-sm leading-5 text-mute">
            You matched with {student.name.split(' ')[0]}. Say hello.
          </p>
        ) : (
          <ul className="grid gap-2">
            {messages.map((message, index) => {
              const previous = messages[index - 1]
              const showTime = !previous || !sameTimeGroup(previous.createdAt, message.createdAt)
              return (
                <li key={message.id} className="grid gap-2">
                  {showTime ? (
                    <p className="text-center text-[11px] font-semibold text-mute">{shortTime(message.createdAt)}</p>
                  ) : null}
                  <div className={message.from === 'me' ? 'flex justify-end' : 'flex items-end gap-1'}>
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
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-line px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault()
          void submitMessage()
        }}
      >
        {sendError ? (
          <p className="mb-2 text-xs leading-4 text-coral" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={composerRef}
            value={draft}
            rows={1}
            onChange={(event) => {
              setDraft(event.target.value)
              if (sendError) setSendError('')
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
              if (!window.matchMedia('(pointer: fine)').matches) return
              event.preventDefault()
              void submitMessage()
            }}
            maxLength={500}
            placeholder="Message"
            aria-label="Message"
            className="max-h-32 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto rounded-[1.5rem] bg-blush px-4 py-3 text-sm leading-5 outline-none placeholder:text-mute"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={sending || draft.trim().length === 0}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-white disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </div>
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
            This removes the messages for both you and {student.name.split(' ')[0]}. The match stays.
          </p>
          <Button
            fullWidth
            className="mt-4"
            onClick={() => {
              deleteConversation(matchId)
              setSheet(null)
            }}
          >
            Delete for both
          </Button>
        </Sheet>
      ) : null}

      {sheet === 'unmatch' ? (
        <Sheet title={`Unmatch ${student.name.split(' ')[0]}?`} onClose={() => setSheet(null)}>
          <p className="text-sm leading-5 text-mute">This ends the match for both of you. The conversation leaves Matches.</p>
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
