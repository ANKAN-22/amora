import { useSyncExternalStore } from 'react'
import { campusStudents, studentById, type CampusStudent } from '@/data/students.ts'
import type { StudentProfile } from '@/lib/profile.ts'

const socialKey = 'amora.social'

export const reportReasons = [
  'Harassment',
  'Fake profile',
  'Inappropriate content',
  'Spam',
  'Threats',
  'Underage concern',
  'Other',
] as const

export type ReportReason = (typeof reportReasons)[number]

export type Match = {
  id: string
  studentId: string
  createdAt: string
  seen: boolean
}

export type ChatMessage = {
  id: string
  matchId: string
  from: 'me' | 'them'
  text: string
  createdAt: string
}

export type Report = {
  id: string
  studentId: string
  matchId: string
  messageId: string
  reason: ReportReason
  createdAt: string
}

export type SocialState = {
  passed: string[]
  liked: string[]
  matches: Match[]
  messages: ChatMessage[]
  blocks: string[]
  hidden: string[]
  reports: Report[]
}

export type LikeResult = {
  matched: boolean
  matchId: string | null
}

const emptyState = (): SocialState => ({
  passed: [],
  liked: [],
  matches: [],
  messages: [],
  blocks: [],
  hidden: [],
  reports: [],
})

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

function isMatch(value: unknown): value is Match {
  if (!value || typeof value !== 'object') return false
  const match = value as Partial<Match>
  return (
    typeof match.id === 'string' &&
    typeof match.studentId === 'string' &&
    typeof match.createdAt === 'string' &&
    typeof match.seen === 'boolean'
  )
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<ChatMessage>
  return (
    typeof message.id === 'string' &&
    typeof message.matchId === 'string' &&
    (message.from === 'me' || message.from === 'them') &&
    typeof message.text === 'string' &&
    typeof message.createdAt === 'string'
  )
}

function isReport(value: unknown): value is Report {
  if (!value || typeof value !== 'object') return false
  const report = value as Partial<Report>
  return (
    typeof report.id === 'string' &&
    typeof report.studentId === 'string' &&
    typeof report.matchId === 'string' &&
    typeof report.messageId === 'string' &&
    typeof report.reason === 'string' &&
    reportReasons.includes(report.reason as ReportReason) &&
    typeof report.createdAt === 'string'
  )
}

function load(): SocialState {
  try {
    const raw = localStorage.getItem(socialKey)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<SocialState>
    return {
      passed: strings(parsed.passed),
      liked: strings(parsed.liked),
      blocks: strings(parsed.blocks),
      hidden: strings(parsed.hidden),
      matches: Array.isArray(parsed.matches) ? parsed.matches.filter(isMatch) : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages.filter(isMessage) : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports.filter(isReport) : [],
    }
  } catch {
    return emptyState()
  }
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: SocialState) {
  state = next
  try {
    localStorage.setItem(socialKey, JSON.stringify(next))
  } catch {
    // The screen still updates if this browser refuses the write.
  }
  for (const listener of listeners) listener()
}

export function subscribeSocial(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSocial() {
  return state
}

export function useSocial() {
  return useSyncExternalStore(subscribeSocial, getSocial, getSocial)
}

export function fitsPreferences(student: CampusStudent, profile: StudentProfile) {
  if (student.age < profile.ageMin || student.age > profile.ageMax) return false
  if (profile.lookingFor === 'Women') return student.gender === 'Woman'
  if (profile.lookingFor === 'Men') return student.gender === 'Man'
  return true
}

export function isMatched(studentId: string, social: SocialState = state) {
  return social.matches.some((match) => match.studentId === studentId)
}

export function isOpen(student: CampusStudent, social: SocialState = state) {
  return (
    !social.blocks.includes(student.id) &&
    !social.hidden.includes(student.id) &&
    !social.passed.includes(student.id) &&
    !social.liked.includes(student.id) &&
    !isMatched(student.id, social)
  )
}

export function incomingLikes(social: SocialState = state) {
  return campusStudents.filter(
    (student) => student.likedYou && !social.blocks.includes(student.id) && !isMatched(student.id, social),
  )
}

export function outgoingLikes(social: SocialState = state) {
  return social.liked
    .map((id) => studentById(id))
    .filter((student): student is CampusStudent => {
      return student !== null && !social.blocks.includes(student.id) && !isMatched(student.id, social)
    })
}

export function visibleMatches(social: SocialState = state) {
  return social.matches.filter((match) => {
    const student = studentById(match.studentId)
    return student !== null && !social.blocks.includes(student.id)
  })
}

export function passStudent(studentId: string) {
  if (state.blocks.includes(studentId) || state.passed.includes(studentId) || isMatched(studentId)) return
  commit({ ...state, passed: [...state.passed, studentId] })
}

export function likeStudent(studentId: string): LikeResult {
  const student = studentById(studentId)
  if (!student || state.blocks.includes(studentId)) return { matched: false, matchId: null }

  const existing = state.matches.find((match) => match.studentId === studentId)
  if (existing) return { matched: true, matchId: existing.id }

  const liked = state.liked.includes(studentId) ? state.liked : [...state.liked, studentId]
  const passed = state.passed.filter((id) => id !== studentId)
  const hidden = state.hidden.filter((id) => id !== studentId)
  const mutual = student.likedYou || student.likesBack

  if (!mutual) {
    commit({ ...state, liked, passed, hidden })
    return { matched: false, matchId: null }
  }

  const matchId = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  commit({
    ...state,
    liked,
    passed,
    hidden,
    matches: [{ id: matchId, studentId, createdAt, seen: false }, ...state.matches],
    messages: [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        matchId,
        from: 'them',
        text: student.hello,
        createdAt,
      },
    ],
  })
  return { matched: true, matchId }
}

export function markMatchSeen(matchId: string) {
  if (!state.matches.some((match) => match.id === matchId && !match.seen)) return
  commit({
    ...state,
    matches: state.matches.map((match) => (match.id === matchId ? { ...match, seen: true } : match)),
  })
}

export function sendMessage(matchId: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 500) return false
  const match = state.matches.find((item) => item.id === matchId)
  if (!match || state.blocks.includes(match.studentId)) return false
  commit({
    ...state,
    messages: [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        matchId,
        from: 'me',
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ],
  })
  return true
}

export function deleteConversation(matchId: string) {
  commit({
    ...state,
    messages: state.messages.filter((message) => message.matchId !== matchId),
  })
}

export function unmatch(matchId: string) {
  const match = state.matches.find((item) => item.id === matchId)
  if (!match) return
  commit({
    ...state,
    matches: state.matches.filter((item) => item.id !== matchId),
    messages: state.messages.filter((message) => message.matchId !== matchId),
    liked: state.liked.filter((id) => id !== match.studentId),
  })
}

export function blockStudent(studentId: string) {
  const removed = new Set(
    state.matches.filter((match) => match.studentId === studentId).map((match) => match.id),
  )
  commit({
    ...state,
    blocks: state.blocks.includes(studentId) ? state.blocks : [...state.blocks, studentId],
    hidden: state.hidden.filter((id) => id !== studentId),
    matches: state.matches.filter((match) => match.studentId !== studentId),
    messages: state.messages.filter((message) => !removed.has(message.matchId)),
    liked: state.liked.filter((id) => id !== studentId),
  })
}

export function unblockStudent(studentId: string) {
  if (!state.blocks.includes(studentId)) return
  commit({ ...state, blocks: state.blocks.filter((id) => id !== studentId) })
}

export function hideStudent(studentId: string) {
  if (state.blocks.includes(studentId) || state.hidden.includes(studentId)) return
  commit({ ...state, hidden: [...state.hidden, studentId] })
}

export function unhideStudent(studentId: string) {
  if (!state.hidden.includes(studentId)) return
  commit({ ...state, hidden: state.hidden.filter((id) => id !== studentId) })
}

export function clearSocial() {
  commit(emptyState())
}

export function reportStudent(input: {
  studentId: string
  matchId: string
  messageId?: string
  reason: ReportReason
}) {
  commit({
    ...state,
    reports: [
      ...state.reports,
      {
        id: crypto.randomUUID(),
        studentId: input.studentId,
        matchId: input.matchId,
        messageId: input.messageId ?? '',
        reason: input.reason,
        createdAt: new Date().toISOString(),
      },
    ],
  })
}

export function messagesFor(matchId: string, social: SocialState = state) {
  return social.messages.filter((message) => message.matchId === matchId)
}

export function lastMessage(matchId: string, social: SocialState = state) {
  const thread = messagesFor(matchId, social)
  return thread.length > 0 ? thread[thread.length - 1] : null
}
