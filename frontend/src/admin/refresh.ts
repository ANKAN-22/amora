import { useSyncExternalStore } from 'react'

// A tiny counter. Any admin page that loads data reads it, so bumping it after a
// mutation (like a deletion) makes every mounted admin view reload its data.
let version = 0
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function bumpAdminData() {
  version += 1
  for (const listener of listeners) listener()
}

export function useAdminDataVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version)
}
