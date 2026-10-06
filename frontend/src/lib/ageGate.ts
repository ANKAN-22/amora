const storageKey = 'amora.age'

export type AgeChoice = 'yes' | 'no'

export function readAgeChoice(): AgeChoice | null {
  const value = sessionStorage.getItem(storageKey)
  return value === 'yes' || value === 'no' ? value : null
}

export function saveAgeChoice(choice: AgeChoice) {
  sessionStorage.setItem(storageKey, choice)
}

export function clearAgeChoice() {
  sessionStorage.removeItem(storageKey)
}
