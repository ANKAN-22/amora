import { useSyncExternalStore } from 'react'

const settingsKey = 'amora.settings'

export type AppSettings = {
  showAge: boolean
  showCampus: boolean
  notifyLikes: boolean
  notifyMatches: boolean
  notifyMessages: boolean
}

function defaults(): AppSettings {
  return {
    showAge: true,
    showCampus: true,
    notifyLikes: true,
    notifyMatches: true,
    notifyMessages: true,
  }
}

function load(): AppSettings {
  const base = defaults()
  try {
    const raw = localStorage.getItem(settingsKey)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      showAge: typeof parsed.showAge === 'boolean' ? parsed.showAge : base.showAge,
      showCampus: typeof parsed.showCampus === 'boolean' ? parsed.showCampus : base.showCampus,
      notifyLikes: typeof parsed.notifyLikes === 'boolean' ? parsed.notifyLikes : base.notifyLikes,
      notifyMatches: typeof parsed.notifyMatches === 'boolean' ? parsed.notifyMatches : base.notifyMatches,
      notifyMessages: typeof parsed.notifyMessages === 'boolean' ? parsed.notifyMessages : base.notifyMessages,
    }
  } catch {
    return base
  }
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: AppSettings) {
  state = next
  try {
    localStorage.setItem(settingsKey, JSON.stringify(next))
  } catch {
    // The screen still updates if this browser refuses the write.
  }
  for (const listener of listeners) listener()
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSettings() {
  return state
}

export function useSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings)
}

export function updateSettings(patch: Partial<AppSettings>) {
  commit({ ...state, ...patch })
}

export function clearSettings() {
  state = defaults()
  try {
    localStorage.removeItem(settingsKey)
  } catch {
    // The in-memory settings are already back to the defaults.
  }
  for (const listener of listeners) listener()
}
