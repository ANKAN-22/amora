import { type ChangeEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/shared/Button.tsx'
import { SelectField } from '@/shared/SelectField.tsx'
import { TextField } from '@/shared/TextField.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { addProfilePhoto, hasSession, removeProfilePhoto, saveProfile, useSession } from '@/lib/account.ts'
import { compressImage } from '@/lib/image.ts'
import {
  blankProfile,
  genderOptions,
  interestOptions,
  lookingForOptions,
  profileProgress,
  type StudentProfile,
} from '@/lib/profile.ts'

const years = ['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate']
const ages = Array.from({ length: 23 }, (_, index) => 18 + index)
const steps = ['Photos', 'About', 'Interests', 'Basics', 'Preferences']

export function ProfileSetupPage() {
  usePageTitle('Create profile')
  const navigate = useNavigate()
  const session = useSession()
  const account = session.account
  const [startedComplete] = useState(() => {
    const saved = session.profile
    return saved ? profileProgress(saved).complete : false
  })
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<StudentProfile>(() => {
    return session.profile ?? blankProfile({ department: account?.department ?? '', year: account?.year ?? '' })
  })
  const [notice, setNotice] = useState('')
  const [reading, setReading] = useState(false)

  if (!hasSession() || !account) return <Navigate to="/login" replace />
  if (account.verificationStatus !== 'APPROVED') return <Navigate to="/verify" replace />

  const progress = profileProgress(profile)

  function update(next: StudentProfile) {
    setProfile(next)
    void saveProfile(next).then((message) => {
      if (message) setNotice(message)
    })
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || profile.photoPaths.length >= 4) return

    setReading(true)
    setNotice('')
    try {
      const photo = await compressImage(file)
      const saved = await addProfilePhoto(photo)
      if ('error' in saved) {
        setNotice(saved.error ?? 'Could not save that photo.')
        return
      }
      setProfile(saved.profile)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read that image.')
    } finally {
      setReading(false)
    }
  }

  async function finish() {
    if (!progress.complete) {
      const answered = profile.prompts.filter((prompt) => prompt.answer.trim().length >= 8).length
      if (profile.photoPaths.length < 2) setStep(0)
      else if (profile.bio.trim().length < 40 || answered < 2) setStep(1)
      else if (profile.interests.length < 3) setStep(2)
      else setStep(3)
      setNotice(progress.missing[0] ?? 'Finish the missing parts of your profile.')
      return
    }
    const message = await saveProfile(profile)
    if (message) {
      setNotice(message)
      return
    }
    navigate(startedComplete ? '/profile' : '/discover', { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-8">
      <button
        type="button"
        onClick={() => {
          setNotice('')
          if (step === 0) navigate(startedComplete ? '/profile' : '/verify')
          else setStep(step - 1)
        }}
        className="text-sm font-semibold text-mute"
      >
        Back
      </button>

      <div className="mt-6 flex gap-2" aria-hidden="true">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-coral' : 'bg-blush'}`}
          />
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold">Your profile is {progress.percent}% complete.</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blush">
        <div className="h-full rounded-full bg-coral" style={{ width: `${progress.percent}%` }} />
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wide text-mute uppercase">{steps[step]}</p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">Create profile</h1>

      {step === 0 ? <PhotoStep profile={profile} reading={reading} onPhoto={onPhoto} onRemove={(index) => void removeProfilePhoto(index).then((next) => { if (next) setProfile(next) })} /> : null}
      {step === 1 ? <AboutStep profile={profile} onChange={update} /> : null}
      {step === 2 ? <InterestStep profile={profile} onChange={update} /> : null}
      {step === 3 ? <BasicsStep profile={profile} onChange={update} /> : null}
      {step === 4 ? <PreferenceStep profile={profile} missing={progress.missing} onChange={update} /> : null}

      {notice ? (
        <p className="mt-4 text-sm leading-5 text-coral-deep" role="alert">
          {notice}
        </p>
      ) : null}

      {step < 4 ? (
        <Button
          className="mt-6"
          fullWidth
          onClick={() => {
            setNotice('')
            setStep(step + 1)
          }}
        >
          Continue
        </Button>
      ) : (
        <Button className="mt-6" fullWidth onClick={finish}>
          {startedComplete ? 'Save profile' : 'Open Discover'}
        </Button>
      )}
    </div>
  )
}

function PhotoStep({
  profile,
  reading,
  onPhoto,
  onRemove,
}: {
  profile: StudentProfile
  reading: boolean
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-mute">Add 2 photos. You can add up to 4.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {profile.photos.map((photo, index) => (
          <div key={photo.slice(0, 32) + index} className="relative">
            <img src={photo} alt="" className="h-36 w-full rounded-[1.4rem] object-cover" />
            <button
              type="button"
              aria-label={`Remove photo ${index + 1}`}
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white text-ink shadow-soft"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {profile.photos.length < 4 ? (
          <label className="flex h-36 cursor-pointer items-center justify-center rounded-[1.4rem] border border-dashed border-coral/50 bg-blush text-sm font-semibold text-coral">
            <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
            {reading ? 'Reading…' : 'Add photo'}
          </label>
        ) : null}
      </div>
    </div>
  )
}

function AboutStep({
  profile,
  onChange,
}: {
  profile: StudentProfile
  onChange: (profile: StudentProfile) => void
}) {
  return (
    <div className="mt-5 grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Bio</span>
        <textarea
          value={profile.bio}
          onChange={(event) => onChange({ ...profile, bio: event.target.value })}
          rows={4}
          placeholder="At least 40 characters"
          className="w-full rounded-2xl bg-[#fff5f7] px-4 py-3 text-sm text-ink outline-none ring-1 ring-black/5 focus:bg-white focus:ring-coral"
        />
      </label>
      {profile.prompts.map((prompt, index) => {
        const count = prompt.answer.trim().length
        return (
          <label key={prompt.question} className="block">
            <span className="mb-1.5 block text-sm font-semibold">{prompt.question}</span>
            <input
              value={prompt.answer}
              onChange={(event) => {
                const prompts = profile.prompts.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, answer: event.target.value } : item,
                )
                onChange({ ...profile, prompts })
              }}
              className="h-12 w-full rounded-2xl bg-[#fff5f7] px-4 text-sm outline-none ring-1 ring-black/5 focus:bg-white focus:ring-coral"
            />
            <span className={`mt-1 block text-xs ${count >= 8 ? 'text-mute' : 'text-coral'}`}>
              {count >= 8 ? 'Long enough' : `${count}/8 characters`}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function InterestStep({
  profile,
  onChange,
}: {
  profile: StudentProfile
  onChange: (profile: StudentProfile) => void
}) {
  function toggle(interest: string) {
    const interests = profile.interests.includes(interest)
      ? profile.interests.filter((item) => item !== interest)
      : [...profile.interests, interest]
    onChange({ ...profile, interests })
  }

  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-mute">Pick at least 3.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {interestOptions.map((interest) => {
          const selected = profile.interests.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                selected ? 'bg-coral text-white' : 'bg-blush text-ink'
              }`}
            >
              {interest}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BasicsStep({
  profile,
  onChange,
}: {
  profile: StudentProfile
  onChange: (profile: StudentProfile) => void
}) {
  return (
    <div className="mt-5 grid gap-4">
      <TextField
        label="Department"
        name="department"
        value={profile.department}
        onChange={(event) => onChange({ ...profile, department: event.target.value })}
      />
      <SelectField
        label="Year"
        name="year"
        value={profile.year}
        onChange={(event) => onChange({ ...profile, year: event.target.value })}
      >
        <option value="">Select your year</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </SelectField>
    </div>
  )
}

function PreferenceStep({
  profile,
  missing,
  onChange,
}: {
  profile: StudentProfile
  missing: string[]
  onChange: (profile: StudentProfile) => void
}) {
  return (
    <div className="mt-5 grid gap-5">
      <ChoiceGroup
        label="I am"
        options={genderOptions}
        value={profile.gender}
        onChange={(gender) => onChange({ ...profile, gender })}
      />
      <ChoiceGroup
        label="Looking for"
        options={lookingForOptions}
        value={profile.lookingFor}
        onChange={(lookingFor) => onChange({ ...profile, lookingFor })}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Age from"
          name="ageMin"
          value={String(profile.ageMin)}
          onChange={(event) => onChange({ ...profile, ageMin: Number(event.target.value) })}
        >
          {ages.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Age to"
          name="ageMax"
          value={String(profile.ageMax)}
          onChange={(event) => onChange({ ...profile, ageMax: Number(event.target.value) })}
        >
          {ages.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </SelectField>
      </div>
      {missing.length > 0 ? (
        <ul className="grid gap-1 text-sm text-mute">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-semibold text-coral">Your profile is ready.</p>
      )}
    </div>
  )
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-2 text-sm font-semibold ${
              value === option ? 'bg-coral text-white' : 'bg-blush text-ink'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
