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
  photoPaths: string[]
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

export function promptsFrom(value: unknown) {
  const saved = Array.isArray(value) ? value : []
  return promptQuestions.map((question) => {
    const match = saved.find((item) => {
      return !!item && typeof item === 'object' && 'question' in item && item.question === question
    }) as { answer?: unknown } | undefined
    return { question, answer: typeof match?.answer === 'string' ? match.answer : '' }
  })
}

export function blankProfile(seed: { department: string; year: string }): StudentProfile {
  return {
    photos: [],
    photoPaths: [],
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

export function profileFromParts(input: {
  photos?: unknown
  photoPaths?: unknown
  bio?: unknown
  prompts?: unknown
  interests?: unknown
  department?: unknown
  year?: unknown
  gender?: unknown
  ageMin?: unknown
  ageMax?: unknown
  lookingFor?: unknown
}): StudentProfile {
  const paths = Array.isArray(input.photoPaths) ? input.photoPaths.filter((item) => typeof item === 'string') : []
  const photos = Array.isArray(input.photos) ? input.photos.filter((item) => typeof item === 'string') : paths
  return {
    photos: photos.slice(0, 4),
    photoPaths: paths.slice(0, 4),
    bio: typeof input.bio === 'string' ? input.bio : '',
    prompts: promptsFrom(input.prompts),
    interests: Array.isArray(input.interests) ? input.interests.filter((item) => typeof item === 'string') : [],
    department: typeof input.department === 'string' ? input.department : '',
    year: typeof input.year === 'string' ? input.year : '',
    gender: typeof input.gender === 'string' ? input.gender : '',
    ageMin: typeof input.ageMin === 'number' ? input.ageMin : 18,
    ageMax: typeof input.ageMax === 'number' ? input.ageMax : 26,
    lookingFor: typeof input.lookingFor === 'string' ? input.lookingFor : '',
  }
}

function answeredPrompts(profile: StudentProfile) {
  return profile.prompts.filter((prompt) => prompt.answer.trim().length >= 8).length
}

export function profileProgress(profile: StudentProfile) {
  const photoCount = profile.photoPaths.length
  const photoScore = (Math.min(photoCount, 2) / 2) * 20
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
  if (photoCount < 2) missing.push('Add 2 photos')
  if (bioLength < 40) missing.push('Write a bio of at least 40 characters')
  const answered = answeredPrompts(profile)
  if (answered < 2) {
    missing.push(
      answered === 1
        ? 'One prompt still needs at least 8 characters'
        : 'Answer 2 prompts with at least 8 characters each',
    )
  }
  if (profile.interests.length < 3) missing.push('Pick 3 interests')
  if (basicsScore === 0) missing.push('Add your department and year')
  if (prefsScore === 0) missing.push('Set who you want to meet')

  return { percent, missing, complete: missing.length === 0 }
}
