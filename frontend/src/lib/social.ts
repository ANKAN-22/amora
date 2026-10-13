import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '@/lib/account.ts'
import { backgroundFor, type Person } from '@/lib/people.ts'
import { profileFromParts, profileProgress, promptsFrom, type StudentProfile } from '@/lib/profile.ts'
import { supabase } from '@/lib/supabase.ts'

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
  iAmUserA: boolean
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
  resolved: boolean
}

export type SocialState = {
  ready: boolean
  passed: string[]
  liked: string[]
  incoming: string[]
  matches: Match[]
  messages: ChatMessage[]
  blocks: string[]
  blockedBy: string[]
  hidden: string[]
  reports: Report[]
  people: Record<string, Person>
  directory: Person[]
}

export type LikeResult = {
  matched: boolean
  matchId: string | null
}

type DirectoryRow = {
  id: string
  name: string
  age: number
  department: string
  year: string
  bio: string
  prompts: unknown
  interests: string[] | null
  gender: string
  looking_for: string
  age_min: number
  age_max: number
  photo_paths: string[] | null
  verification_status: string
}

const emptyState = (ready: boolean): SocialState => ({
  ready,
  passed: [],
  liked: [],
  incoming: [],
  matches: [],
  messages: [],
  blocks: [],
  blockedBy: [],
  hidden: [],
  reports: [],
  people: {},
  directory: [],
})

let state = emptyState(false)
const listeners = new Set<() => void>()
let reloadTimer: ReturnType<typeof setTimeout> | null = null
let listening = false

function emit() {
  for (const listener of listeners) listener()
}

function commit(next: SocialState) {
  state = next
  emit()
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

export function personById(id: string) {
  return state.people[id] ?? null
}

export function fitsPreferences(student: Person, profile: StudentProfile) {
  if (student.age < profile.ageMin || student.age > profile.ageMax) return false
  if (profile.lookingFor === 'Women') return student.gender === 'Woman'
  if (profile.lookingFor === 'Men') return student.gender === 'Man'
  return true
}

export function isMatched(studentId: string, social: SocialState = state) {
  return social.matches.some((match) => match.studentId === studentId)
}

export function isOpen(student: Person, social: SocialState = state) {
  return (
    !social.blocks.includes(student.id) &&
    !social.blockedBy.includes(student.id) &&
    !social.hidden.includes(student.id) &&
    !social.passed.includes(student.id) &&
    !social.liked.includes(student.id) &&
    !isMatched(student.id, social)
  )
}

export function incomingLikes(social: SocialState = state) {
  return social.incoming
    .map((id) => social.people[id])
    .filter((student): student is Person => {
      return !!student && !social.blocks.includes(student.id) && !social.blockedBy.includes(student.id) && !isMatched(student.id, social)
    })
}

export function outgoingLikes(social: SocialState = state) {
  return social.liked
    .map((id) => social.people[id])
    .filter((student): student is Person => {
      return !!student && !social.blocks.includes(student.id) && !social.blockedBy.includes(student.id) && !isMatched(student.id, social)
    })
}

export function visibleMatches(social: SocialState = state) {
  return social.matches.filter((match) => {
    return social.people[match.studentId] && !social.blocks.includes(match.studentId) && !social.blockedBy.includes(match.studentId)
  })
}

export function messagesFor(matchId: string, social: SocialState = state) {
  return social.messages.filter((message) => message.matchId === matchId)
}

export function isUnread(match: Match, social: SocialState = state) {
  if (match.seen) return false
  return social.messages.some((message) => message.matchId === match.id && message.from === 'them')
}

export function lastMessage(matchId: string, social: SocialState = state) {
  const thread = messagesFor(matchId, social)
  return thread.length > 0 ? thread[thread.length - 1] : null
}

function isReason(value: string): value is ReportReason {
  return reportReasons.includes(value as ReportReason)
}

async function signedPhotos(paths: string[]) {
  const map: Record<string, string> = {}
  if (!supabase || paths.length === 0) return map
  const { data } = await supabase.storage.from('photos').createSignedUrls(paths, 60 * 60)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl
  }
  return map
}

function personFrom(row: DirectoryRow, photos: Record<string, string>): Person {
  const paths = row.photo_paths ?? []
  return {
    id: row.id,
    name: row.name || 'Student',
    age: row.age,
    gender: row.gender,
    department: row.department,
    year: row.year,
    bio: row.bio,
    interests: row.interests ?? [],
    prompts: promptsFrom(row.prompts),
    photoUrls: paths.map((path) => photos[path]).filter((url): url is string => Boolean(url)),
    background: backgroundFor(row.id),
    verificationStatus: row.verification_status,
  }
}

export async function reloadSocial() {
  const me = getSession().userId
  if (!supabase || !me) {
    commit(emptyState(true))
    return
  }

  const [directoryResult, likesResult, passesResult, hidesResult, blocksResult, matchesResult, reportsResult] = await Promise.all([
    supabase.from('directory').select('*'),
    supabase.from('likes').select('from_id, to_id').or(`from_id.eq.${me},to_id.eq.${me}`),
    supabase.from('passes').select('to_id').eq('from_id', me),
    supabase.from('hides').select('hidden_id').eq('user_id', me),
    supabase.from('blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${me},blocked_id.eq.${me}`),
    supabase.from('matches').select('*').or(`user_a.eq.${me},user_b.eq.${me}`),
    supabase.from('reports').select('id, target_id, match_id, message_id, reason, created_at, resolved').eq('reporter_id', me),
  ])

  const directoryRows = (directoryResult.data ?? []) as DirectoryRow[]
  const likeRows = (likesResult.data ?? []) as { from_id: string; to_id: string }[]
  const passRows = (passesResult.data ?? []) as { to_id: string }[]
  const hideRows = (hidesResult.data ?? []) as { hidden_id: string }[]
  const blockRows = (blocksResult.data ?? []) as { blocker_id: string; blocked_id: string }[]
  const matchRows = (matchesResult.data ?? []) as {
    id: string
    user_a: string
    user_b: string
    created_at: string
    seen_a: boolean
    seen_b: boolean
  }[]
  const reportRows = (reportsResult.data ?? []) as {
    id: string
    target_id: string
    match_id: string | null
    message_id: string | null
    reason: string
    created_at: string
    resolved: boolean
  }[]

  const matchIds = matchRows.map((match) => match.id)
  const messageResult = matchIds.length
    ? await supabase.from('messages').select('*').in('match_id', matchIds).order('created_at', { ascending: true })
    : { data: [] }
  const messageRows = (messageResult.data ?? []) as {
    id: string
    match_id: string
    sender_id: string
    body: string
    created_at: string
  }[]

  const photoPaths = directoryRows.flatMap((row) => row.photo_paths ?? [])
  const photos = await signedPhotos(photoPaths)
  const people: Record<string, Person> = {}
  const directory: Person[] = []

  for (const row of directoryRows) {
    const person = personFrom(row, photos)
    people[person.id] = person
    const card = profileFromParts({
      photoPaths: row.photo_paths ?? [],
      photos: row.photo_paths ?? [],
      bio: row.bio,
      prompts: row.prompts,
      interests: row.interests ?? [],
      department: row.department,
      year: row.year,
      gender: row.gender,
      ageMin: row.age_min,
      ageMax: row.age_max,
      lookingFor: row.looking_for,
    })
    if (row.id !== me && row.verification_status === 'APPROVED' && profileProgress(card).complete) {
      directory.push(person)
    }
  }

  commit({
    ready: true,
    passed: passRows.map((row) => row.to_id),
    liked: likeRows.filter((row) => row.from_id === me).map((row) => row.to_id),
    incoming: likeRows.filter((row) => row.to_id === me).map((row) => row.from_id),
    matches: matchRows.map((match) => ({
      id: match.id,
      studentId: match.user_a === me ? match.user_b : match.user_a,
      createdAt: match.created_at,
      seen: match.user_a === me ? match.seen_a : match.seen_b,
      iAmUserA: match.user_a === me,
    })),
    messages: messageRows.map((message) => ({
      id: message.id,
      matchId: message.match_id,
      from: message.sender_id === me ? 'me' : 'them',
      text: message.body,
      createdAt: message.created_at,
    })),
    blocks: blockRows.filter((row) => row.blocker_id === me).map((row) => row.blocked_id),
    blockedBy: blockRows.filter((row) => row.blocked_id === me).map((row) => row.blocker_id),
    hidden: hideRows.map((row) => row.hidden_id),
    reports: reportRows
      .filter((row) => isReason(row.reason))
      .map((row) => ({
        id: row.id,
        studentId: row.target_id,
        matchId: row.match_id ?? '',
        messageId: row.message_id ?? '',
        reason: row.reason as ReportReason,
        createdAt: row.created_at,
        resolved: row.resolved,
      })),
    people,
    directory,
  })
}

function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => {
    void reloadSocial()
  }, 250)
}

function listen() {
  if (!supabase || listening) return
  listening = true
  void supabase
    .channel('amora-social')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, scheduleReload)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, scheduleReload)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, scheduleReload)
    .subscribe()
}

subscribeSession(() => {
  const userId = getSession().userId
  if (!getSession().ready) return
  if (!userId) {
    commit(emptyState(true))
    return
  }
  listen()
  void reloadSocial()
})

export async function passStudent(studentId: string) {
  const me = getSession().userId
  if (!supabase || !me || state.blocks.includes(studentId) || state.passed.includes(studentId) || isMatched(studentId)) return
  commit({ ...state, passed: [...state.passed, studentId] })
  const { error } = await supabase.from('passes').insert({ from_id: me, to_id: studentId })
  if (error && error.code !== '23505') scheduleReload()
}

export async function likeStudent(studentId: string): Promise<LikeResult> {
  if (!supabase || !getSession().userId || state.blocks.includes(studentId) || state.blockedBy.includes(studentId)) {
    return { matched: false, matchId: null }
  }
  const existing = state.matches.find((match) => match.studentId === studentId)
  if (existing) return { matched: true, matchId: existing.id }

  const { data, error } = await supabase.rpc('like_student', { target: studentId })
  await reloadSocial()
  if (error) return { matched: false, matchId: null }
  const matchId = typeof data === 'string' ? data : null
  return { matched: Boolean(matchId), matchId }
}

export async function markMatchSeen(matchId: string) {
  const match = state.matches.find((item) => item.id === matchId)
  if (!supabase || !match || match.seen) return
  commit({
    ...state,
    matches: state.matches.map((item) => (item.id === matchId ? { ...item, seen: true } : item)),
  })
  const { error } = await supabase.from('matches').update(match.iAmUserA ? { seen_a: true } : { seen_b: true }).eq('id', matchId)
  if (error) scheduleReload()
}

let sendInFlight = false

function friendlySendError(error: { code?: string; message?: string }) {
  const code = error.code ?? ''
  if (code === '23514' || code === '22001') return 'Messages can be up to 500 characters.'
  if (code === '42501' || code === 'PGRST301' || code === '401') return "You don't have permission to send that."
  if (code === '23503') return 'This conversation is no longer available.'
  const note = (error.message ?? '').toLowerCase()
  if (note.includes('failed to fetch') || note.includes('network')) return "Couldn't send. Check your connection and try again."
  return "Couldn't send that message. Try again."
}

export async function sendMessage(matchId: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, message: 'Write a message first.' }
  if (trimmed.length > 500) return { ok: false, message: 'Messages can be up to 500 characters.' }
  if (sendInFlight) return { ok: false, message: '' }

  const me = getSession().userId
  const match = state.matches.find((item) => item.id === matchId)
  if (!supabase) return { ok: false, message: "Couldn't send. Check your connection and try again." }
  if (!me) return { ok: false, message: 'Sign in again to send a message.' }
  if (!match) return { ok: false, message: 'This conversation is no longer available.' }
  if (state.blocks.includes(match.studentId) || state.blockedBy.includes(match.studentId)) {
    return { ok: false, message: "You can't message this student." }
  }

  sendInFlight = true
  try {
    const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: me, body: trimmed })
    if (error) return { ok: false, message: friendlySendError(error) }
    await reloadSocial()
    return { ok: true, message: '' }
  } catch {
    return { ok: false, message: "Couldn't send. Check your connection and try again." }
  } finally {
    sendInFlight = false
  }
}

export async function deleteConversation(matchId: string) {
  if (!supabase) return
  commit({ ...state, messages: state.messages.filter((message) => message.matchId !== matchId) })
  const { error } = await supabase.rpc('clear_conversation', { match_id: matchId })
  if (error) scheduleReload()
}

export async function unmatch(matchId: string) {
  const me = getSession().userId
  const match = state.matches.find((item) => item.id === matchId)
  if (!supabase || !me || !match) return
  const studentId = match.studentId
  commit({
    ...state,
    matches: state.matches.filter((item) => item.id !== matchId),
    messages: state.messages.filter((message) => message.matchId !== matchId),
    liked: state.liked.filter((id) => id !== studentId),
    incoming: state.incoming.filter((id) => id !== studentId),
  })
  const { error } = await supabase.rpc('unmatch_student', { match_id: matchId })
  if (error) scheduleReload()
}

export async function blockStudent(studentId: string) {
  if (!supabase) return
  const removed = new Set(state.matches.filter((match) => match.studentId === studentId).map((match) => match.id))
  commit({
    ...state,
    blocks: state.blocks.includes(studentId) ? state.blocks : [...state.blocks, studentId],
    hidden: state.hidden.filter((id) => id !== studentId),
    matches: state.matches.filter((match) => match.studentId !== studentId),
    messages: state.messages.filter((message) => !removed.has(message.matchId)),
    liked: state.liked.filter((id) => id !== studentId),
    incoming: state.incoming.filter((id) => id !== studentId),
  })
  await supabase.rpc('block_student', { target: studentId })
}

export async function unblockStudent(studentId: string) {
  const me = getSession().userId
  if (!supabase || !me) return
  commit({ ...state, blocks: state.blocks.filter((id) => id !== studentId) })
  await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', studentId)
}

export async function hideStudent(studentId: string) {
  const me = getSession().userId
  if (!supabase || !me || state.blocks.includes(studentId) || state.hidden.includes(studentId)) return
  commit({ ...state, hidden: [...state.hidden, studentId] })
  await supabase.from('hides').insert({ user_id: me, hidden_id: studentId })
}

export async function unhideStudent(studentId: string) {
  const me = getSession().userId
  if (!supabase || !me) return
  commit({ ...state, hidden: state.hidden.filter((id) => id !== studentId) })
  await supabase.from('hides').delete().eq('user_id', me).eq('hidden_id', studentId)
}

export async function reportStudent(input: {
  studentId: string
  matchId: string
  messageId?: string
  reason: ReportReason
}) {
  const me = getSession().userId
  if (!supabase || !me) return
  const { error } = await supabase.from('reports').insert({
    reporter_id: me,
    target_id: input.studentId,
    match_id: input.matchId || null,
    message_id: input.messageId || null,
    reason: input.reason,
  })
  if (!error) await reloadSocial()
}
