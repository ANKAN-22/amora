import { useSyncExternalStore } from 'react'
import { dataUrlToBlob } from '@/lib/image.ts'
import { profileFromParts, profileProgress, type StudentProfile } from '@/lib/profile.ts'
import { supabase, supabaseConfigured } from '@/lib/supabase.ts'

export type VerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'SUSPENDED'

export type AppSettings = {
  showAge: boolean
  showCampus: boolean
  notifyLikes: boolean
  notifyMatches: boolean
  notifyMessages: boolean
}

export type StudentAccount = {
  name: string
  age: number
  email: string
  department: string
  year: string
  studentId: string
  verificationStatus: VerificationStatus
}

export type VerificationRequest = {
  screenshot: string
  submittedAt: string
  reviewNote: string
}

type ProfileRow = {
  id: string
  email: string
  name: string
  age: number
  department: string
  year: string
  student_id: string
  verification_status: string
  review_note: string
  screenshot_path: string | null
  submitted_at: string | null
  bio: string
  prompts: unknown
  interests: string[] | null
  gender: string
  looking_for: string
  age_min: number
  age_max: number
  photo_paths: string[] | null
  show_age: boolean
  show_campus: boolean
  notify_likes: boolean
  notify_matches: boolean
  notify_messages: boolean
}

export type SessionState = {
  configured: boolean
  ready: boolean
  userId: string | null
  account: StudentAccount | null
  profile: StudentProfile | null
  settings: AppSettings
  verification: VerificationRequest | null
}

const defaultSettings = (): AppSettings => ({
  showAge: true,
  showCampus: true,
  notifyLikes: true,
  notifyMatches: true,
  notifyMessages: true,
})

function emptyState(ready: boolean): SessionState {
  return {
    configured: supabaseConfigured,
    ready,
    userId: null,
    account: null,
    profile: null,
    settings: defaultSettings(),
    verification: null,
  }
}

let state = emptyState(false)
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function commit(next: SessionState) {
  state = next
  emit()
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSession() {
  return state
}

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession, getSession)
}

export function useSettings() {
  return useSession().settings
}

function isStatus(value: string): value is VerificationStatus {
  return (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'REJECTED' ||
    value === 'RESUBMISSION_REQUIRED' ||
    value === 'SUSPENDED'
  )
}

async function signedMap(bucket: 'photos' | 'enrollment', paths: string[]) {
  const map: Record<string, string> = {}
  if (!supabase || paths.length === 0) return map
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 60)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl
  }
  return map
}

function accountFrom(row: ProfileRow): StudentAccount {
  return {
    name: row.name,
    age: row.age,
    email: row.email,
    department: row.department,
    year: row.year,
    studentId: row.student_id,
    verificationStatus: isStatus(row.verification_status) ? row.verification_status : 'PENDING',
  }
}

function settingsFrom(row: ProfileRow): AppSettings {
  return {
    showAge: row.show_age,
    showCampus: row.show_campus,
    notifyLikes: row.notify_likes,
    notifyMatches: row.notify_matches,
    notifyMessages: row.notify_messages,
  }
}

async function applyRow(row: ProfileRow) {
  const paths = row.photo_paths ?? []
  const photos = await signedMap('photos', paths)
  const profile = profileFromParts({
    photos: paths.map((path) => photos[path] ?? ''),
    photoPaths: paths,
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
  profile.photos = profile.photos.filter(Boolean)

  let verification: VerificationRequest | null = null
  if (row.screenshot_path) {
    const shot = await signedMap('enrollment', [row.screenshot_path])
    verification = {
      screenshot: shot[row.screenshot_path] ?? '',
      submittedAt: row.submitted_at ?? '',
      reviewNote: row.review_note,
    }
  } else if (row.review_note) {
    verification = { screenshot: '', submittedAt: row.submitted_at ?? '', reviewNote: row.review_note }
  }

  commit({
    configured: true,
    ready: true,
    userId: row.id,
    account: accountFrom(row),
    profile,
    settings: settingsFrom(row),
    verification,
  })
}

export async function refreshSession() {
  if (!supabase || !state.userId) return
  const { data, error } = await supabase.from('profiles').select('*').eq('id', state.userId).maybeSingle()
  if (error || !data) return
  await applyRow(data as ProfileRow)
}

async function loadUser(userId: string) {
  if (!supabase) return
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) {
    commit({ ...emptyState(true), userId })
    return
  }
  await applyRow(data as ProfileRow)
}

let watchedUser: string | null = null

function watchProfile(userId: string) {
  if (!supabase || watchedUser === userId) return
  watchedUser = userId
  void supabase.channel(`profile-${userId}`).on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
    () => {
      void refreshSession()
    },
  ).subscribe()
}

async function boot() {
  if (!supabase) {
    commit(emptyState(true))
    return
  }
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id ?? null
  if (!userId) commit(emptyState(true))
  else {
    await loadUser(userId)
    watchProfile(userId)
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    const nextId = session?.user.id ?? null
    if (!nextId) {
      commit(emptyState(true))
      return
    }
    if (nextId !== state.userId) {
      void loadUser(nextId).then(() => watchProfile(nextId))
    }
  })
}

void boot()

export function hasSession() {
  return Boolean(state.userId && state.account)
}

export function pathAfterLogin() {
  if (state.account?.verificationStatus !== 'APPROVED') return '/verify'
  if (!state.profile || !profileProgress(state.profile).complete) return '/profile-setup'
  return '/discover'
}

export function statusLabel(status: VerificationStatus) {
  if (status === 'APPROVED') return 'Approved'
  if (status === 'PENDING') return 'In review'
  if (status === 'REJECTED') return 'Declined'
  if (status === 'RESUBMISSION_REQUIRED') return 'More information needed'
  return 'Suspended'
}

function authMessage(message: string) {
  if (message.toLowerCase().includes('confirm')) {
    return 'Confirm your email, then log in. For localhost, turn off Confirm email in Supabase.'
  }
  if (message.toLowerCase().includes('already')) return 'That email already has an Amora account. Log in instead.'
  return message
}

async function uploadProof(userId: string, screenshot: string) {
  if (!supabase) return 'Supabase is not connected.'
  const path = `${userId}/proof.jpg`
  const { error } = await supabase.storage.from('enrollment').upload(path, dataUrlToBlob(screenshot), {
    upsert: true,
    contentType: 'image/jpeg',
  })
  if (error) return 'Could not save that screenshot. Try a smaller image.'
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      screenshot_path: path,
      submitted_at: new Date().toISOString(),
      verification_status: 'PENDING',
    })
    .eq('id', userId)
  if (updateError) return 'The screenshot saved, but the account could not be updated.'
  return null
}

export async function createAccountWithProof(input: {
  name: string
  age: number
  email: string
  password: string
  department: string
  year: string
  studentId: string
  screenshot: string
}) {
  if (!supabase) return 'Add your Supabase URL and anon key to frontend/.env, then restart the app.'
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { name: input.name } },
  })
  if (error) return authMessage(error.message)
  const userId = data.session?.user.id ?? data.user?.id
  if (!data.session || !userId) {
    return 'Confirm your email, then log in. For localhost, turn off Confirm email in Supabase.'
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      name: input.name,
      age: input.age,
      department: input.department,
      year: input.year,
      student_id: input.studentId,
    })
    .eq('id', userId)
  if (updateError) return updateError.message

  const uploaded = await uploadProof(userId, input.screenshot)
  if (uploaded) return uploaded
  await loadUser(userId)
  watchProfile(userId)
  return null
}

export async function submitEnrollmentProof(screenshot: string) {
  if (!supabase || !state.userId) return 'Log in again, then upload the screenshot.'
  const uploaded = await uploadProof(state.userId, screenshot)
  if (uploaded) return uploaded
  await refreshSession()
  return null
}

export async function login(email: string, password: string) {
  if (!supabase) return 'Add your Supabase URL and anon key to frontend/.env, then restart the app.'
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) return authMessage(error.message)
  const userId = data.user?.id
  if (!userId) return 'That email and password don’t match.'
  await loadUser(userId)
  watchProfile(userId)
  return null
}

export async function clearSession() {
  watchedUser = null
  await supabase?.auth.signOut()
  commit(emptyState(true))
}

export async function saveProfile(profile: StudentProfile) {
  if (!supabase || !state.userId) return 'Log in again, then save your profile.'
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: profile.bio,
      prompts: profile.prompts,
      interests: profile.interests,
      department: profile.department,
      year: profile.year,
      gender: profile.gender,
      looking_for: profile.lookingFor,
      age_min: profile.ageMin,
      age_max: profile.ageMax,
    })
    .eq('id', state.userId)
  if (error) return error.message
  commit({
    ...state,
    profile,
    account: state.account
      ? { ...state.account, department: profile.department, year: profile.year }
      : state.account,
  })
  return null
}

export async function addProfilePhoto(dataUrl: string) {
  if (!supabase || !state.userId || !state.profile) return { error: 'Log in again, then add the photo.' }
  if (state.profile.photoPaths.length >= 4) return { error: 'You can add up to 4 photos.' }
  const path = `${state.userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, dataUrlToBlob(dataUrl), {
    contentType: 'image/jpeg',
  })
  if (error) return { error: 'Could not save that photo.' }
  const photoPaths = [...state.profile.photoPaths, path]
  const { error: updateError } = await supabase.from('profiles').update({ photo_paths: photoPaths }).eq('id', state.userId)
  if (updateError) return { error: updateError.message || 'Could not save that photo.' }
  const signed = await signedMap('photos', [path])
  const profile = {
    ...state.profile,
    photoPaths,
    photos: [...state.profile.photos, signed[path] ?? ''],
  }
  commit({ ...state, profile })
  return { profile }
}

export async function removeProfilePhoto(index: number) {
  if (!supabase || !state.userId || !state.profile) return
  const path = state.profile.photoPaths[index]
  if (!path) return
  await supabase.storage.from('photos').remove([path])
  const photoPaths = state.profile.photoPaths.filter((_, photoIndex) => photoIndex !== index)
  const photos = state.profile.photos.filter((_, photoIndex) => photoIndex !== index)
  await supabase.from('profiles').update({ photo_paths: photoPaths }).eq('id', state.userId)
  const profile = { ...state.profile, photoPaths, photos }
  commit({ ...state, profile })
  return profile
}

export async function updateSettings(patch: Partial<AppSettings>) {
  if (!supabase || !state.userId) return
  const settings = { ...state.settings, ...patch }
  commit({ ...state, settings })
  await supabase
    .from('profiles')
    .update({
      show_age: settings.showAge,
      show_campus: settings.showCampus,
      notify_likes: settings.notifyLikes,
      notify_matches: settings.notifyMatches,
      notify_messages: settings.notifyMessages,
    })
    .eq('id', state.userId)
}

export async function deleteAccountData() {
  if (!supabase || !state.userId) return
  const userId = state.userId
  const folder = await supabase.storage.from('photos').list(userId)
  const photoPaths = (folder.data ?? []).map((file) => `${userId}/${file.name}`)
  if (photoPaths.length > 0) await supabase.storage.from('photos').remove(photoPaths)
  await supabase.storage.from('enrollment').remove([`${userId}/proof.jpg`])
  await supabase.rpc('delete_own_account')
  await clearSession()
}
