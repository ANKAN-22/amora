const profileKey = 'amora.profile'

export const promptQuestions = [
  'A perfect evening on campus is',
  'I’m hoping to meet someone who',
  'The song I keep replaying is',
]

export const interestOptions = [
  'Dancing',
  'Photography',
  'Music',
  'Sports',
  'Gym',
  'Movies',
  'Reading',
  'Travel',
  'Food',
  'Gaming',
  'Art',
  'Coding',
]

export const genderOptions = ['Woman', 'Man', 'Non-binary']
export const lookingForOptions = ['Women', 'Men', 'Everyone']

export type StudentProfile = {
  photos: string[]
  bio: string
  prompts: { question: string; answer: string }[]
  interests: string[]
  department: string
  year: string
  gender: string
  ageMin: number
  ageMax: number
  lookingFor: string
}

export function blankProfile(seed: { department: string; year: string }): StudentProfile {
  return {
    photos: [],
    bio: '',
    prompts: promptQuestions.map((question) => ({ question, answer: '' })),
    interests: [],
    department: seed.department,
    year: seed.year,
    gender: '',
    ageMin: 18,
    ageMax: 26,
    lookingFor: '',
  }
}

export function readProfile(): StudentProfile | null {
  const raw = localStorage.getItem(profileKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StudentProfile>
    if (!parsed || !Array.isArray(parsed.photos) || typeof parsed.bio !== 'string') return null
    const prompts = promptQuestions.map((question) => {
      const saved = Array.isArray(parsed.prompts)
        ? parsed.prompts.find((item) => item.question === question)
        : undefined
      return { question, answer: typeof saved?.answer === 'string' ? saved.answer : '' }
    })
    return {
      photos: parsed.photos.filter((photo) => typeof photo === 'string').slice(0, 4),
      bio: parsed.bio,
      prompts,
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.filter((item) => typeof item === 'string')
        : [],
      department: typeof parsed.department === 'string' ? parsed.department : '',
      year: typeof parsed.year === 'string' ? parsed.year : '',
      gender: typeof parsed.gender === 'string' ? parsed.gender : '',
      ageMin: typeof parsed.ageMin === 'number' ? parsed.ageMin : 18,
      ageMax: typeof parsed.ageMax === 'number' ? parsed.ageMax : 26,
      lookingFor: typeof parsed.lookingFor === 'string' ? parsed.lookingFor : '',
    }
  } catch {
    return null
  }
}

export function saveProfile(profile: StudentProfile) {
  localStorage.setItem(profileKey, JSON.stringify(profile))
}

function answeredPrompts(profile: StudentProfile) {
  return profile.prompts.filter((prompt) => prompt.answer.trim().length >= 8).length
}

export function profileProgress(profile: StudentProfile) {
  const photoScore = (Math.min(profile.photos.length, 2) / 2) * 20
  const bioLength = profile.bio.trim().length
  const bioScore = bioLength >= 40 ? 20 : bioLength >= 20 ? 10 : 0
  const promptScore = (Math.min(answeredPrompts(profile), 2) / 2) * 15
  const interestScore = (Math.min(profile.interests.length, 3) / 3) * 15
  const basicsScore = profile.department.trim().length >= 2 && profile.year ? 15 : 0
  const prefsScore =
    profile.gender && profile.lookingFor && profile.ageMin >= 18 && profile.ageMax >= profile.ageMin
      ? 15
      : 0
  const percent = Math.round(photoScore + bioScore + promptScore + interestScore + basicsScore + prefsScore)

  const missing: string[] = []
  if (profile.photos.length < 2) missing.push('Add 2 photos')
  if (bioLength < 40) missing.push('Write a bio of at least 40 characters')
  if (answeredPrompts(profile) < 2) missing.push('Answer 2 prompts')
  if (profile.interests.length < 3) missing.push('Pick 3 interests')
  if (basicsScore === 0) missing.push('Add your department and year')
  if (prefsScore === 0) missing.push('Set who you want to meet')

  return { percent, missing, complete: missing.length === 0 }
}
