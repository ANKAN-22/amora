import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { SelectField } from '@/components/SelectField.tsx'
import { TextField } from '@/components/TextField.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { hasSession, readAccount, saveAccount } from '@/lib/account.ts'
import { readAgeChoice, saveAgeChoice } from '@/lib/ageGate.ts'

const years = ['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate']

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function RegisterPage() {
  usePageTitle('Create account')
  const navigate = useNavigate()
  const choice = readAgeChoice()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [studentId, setStudentId] = useState('')
  const [notice, setNotice] = useState('')

  if (choice === 'no') return <Navigate to="/exit" replace />
  if (choice !== 'yes') return <Navigate to="/" replace />
  if (hasSession()) return <Navigate to="/verify" replace />

  function onBasics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const parsedAge = Number(age)

    if (trimmedName.length < 2) {
      setNotice('Enter your full name.')
      return
    }
    if (!age.trim() || !Number.isInteger(parsedAge)) {
      setNotice('Enter your age.')
      return
    }
    if (parsedAge < 18) {
      saveAgeChoice('no')
      navigate('/exit', { replace: true })
      return
    }
    if (parsedAge > 100) {
      setNotice('Enter an age between 18 and 100.')
      return
    }
    if (!isEmail(email.trim())) {
      setNotice('Enter a valid email.')
      return
    }
    if (password.length < 8) {
      setNotice('Use at least 8 characters for your password.')
      return
    }

    const existing = readAccount()
    if (existing && existing.email.toLowerCase() !== email.trim().toLowerCase()) {
      setNotice('This browser already has an Amora account. Log in with that email.')
      return
    }

    setNotice('')
    setStep(2)
  }

  function onUniversity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedDepartment = department.trim()
    const trimmedId = studentId.trim()

    if (trimmedDepartment.length < 2) {
      setNotice('Enter your department.')
      return
    }
    if (!year) {
      setNotice('Select your year.')
      return
    }
    if (trimmedId.length < 3) {
      setNotice('Enter your student ID.')
      return
    }

    const existing = readAccount()
    if (existing && existing.email.toLowerCase() !== email.trim().toLowerCase()) {
      setNotice('This browser already has an Amora account. Log in with that email.')
      return
    }

    saveAccount({
      name: name.trim(),
      age: Number(age),
      email: email.trim(),
      password,
      department: trimmedDepartment,
      year,
      studentId: trimmedId,
      verificationStatus: 'PENDING',
    })
    navigate('/verify', { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-8">
      {step === 1 ? (
        <Link to="/" className="text-sm font-semibold text-mute">
          Back
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNotice('')
            setStep(1)
          }}
          className="text-sm font-semibold text-mute"
        >
          Back
        </button>
      )}

      <div className="mt-6 flex gap-2" aria-hidden="true">
        <span className="h-1.5 flex-1 rounded-full bg-coral" />
        <span className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-coral' : 'bg-blush'}`} />
      </div>
      <p className="mt-3 text-xs font-semibold tracking-wide text-mute uppercase">
        {step === 1 ? 'Basic information' : 'University details'}
      </p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">Create account</h1>

      {step === 1 ? (
        <form className="mt-6 grid gap-4" onSubmit={onBasics}>
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Age"
            name="age"
            inputMode="numeric"
            placeholder="18+"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {notice ? (
            <p className="text-sm leading-5 text-coral-deep" role="alert">
              {notice}
            </p>
          ) : null}
          <Button type="submit" fullWidth>
            Continue
          </Button>
          <p className="text-center text-sm text-mute">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-coral">
              Log in
            </Link>
          </p>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={onUniversity}>
          <TextField
            label="Department"
            name="department"
            placeholder="Computer Science and Engineering"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />
          <SelectField
            label="Year"
            name="year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="">Select your year</option>
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Student ID"
            name="studentId"
            autoComplete="off"
            placeholder="Your university ID"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          />
          {notice ? (
            <p className="text-sm leading-5 text-coral-deep" role="alert">
              {notice}
            </p>
          ) : null}
          <Button type="submit" fullWidth>
            Create account
          </Button>
        </form>
      )}
    </div>
  )
}
