import { Link, Navigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { readAgeChoice } from '@/lib/ageGate.ts'

const details = ['Name', 'Age', 'Email', 'Password', 'Department', 'Year', 'Student ID']

export function RegisterPage() {
  usePageTitle('Create account')
  const choice = readAgeChoice()

  if (choice === 'no') return <Navigate to="/exit" replace />
  if (choice !== 'yes') return <Navigate to="/" replace />

  return (
    <div className="px-5 pt-6 pb-8">
      <Link to="/" className="text-sm font-semibold text-mute">
        Back
      </Link>
      <h1 className="mt-6 text-[1.85rem] font-extrabold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm leading-6 text-mute">
        Amora is currently available only to students of MAKAUT. You’ll need to be 18 or older.
      </p>
      <h2 className="mt-6 text-sm font-bold">What you’ll enter next</h2>
      <ul className="mt-3 grid gap-2.5">
        {details.map((detail) => (
          <li key={detail} className="flex items-center gap-3 text-sm font-semibold">
            <span className="size-2 shrink-0 rounded-full bg-coral" />
            {detail}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-sm text-mute">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-coral">
          Log in
        </Link>
      </p>
    </div>
  )
}
