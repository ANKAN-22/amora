import type { CSSProperties } from 'react'

const gradients = [
  'linear-gradient(180deg, #ffd0dc 0%, #ff8fab 48%, #e25b78 100%)',
  'linear-gradient(180deg, #ffd6c8 0%, #ff8f9a 46%, #d4536e 100%)',
  'linear-gradient(180deg, #ffe0ea 0%, #ff9eb5 50%, #e36b88 100%)',
  'linear-gradient(180deg, #ffd9e2 0%, #ff8aa3 42%, #c94b6a 100%)',
  'linear-gradient(180deg, #ffe4ec 0%, #ffb0c2 46%, #e36d8a 100%)',
  'linear-gradient(180deg, #ffd4df 0%, #ff7f9c 48%, #d14d6c 100%)',
]

export type Person = {
  id: string
  name: string
  age: number
  gender: string
  department: string
  year: string
  bio: string
  interests: string[]
  prompts: { question: string; answer: string }[]
  photoUrls: string[]
  background: string
  verificationStatus: string
}

export function backgroundFor(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash + id.charCodeAt(index)) % gradients.length
  return gradients[hash] ?? gradients[0]
}

export function portraitStyle(person: Pick<Person, 'background' | 'photoUrls'>): CSSProperties {
  const photo = person.photoUrls[0]
  if (!photo) return { background: person.background }
  return {
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.18)), url("${photo}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
