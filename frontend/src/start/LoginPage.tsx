import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/Button.tsx'
import { TextField } from '@/shared/TextField.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { hasSession, login, pathAfterLogin } from '@/lib/account.ts'
import { readAgeChoice } from '@/lib/ageGate.ts'

export function LoginPage() {
  usePageTitle('Log in')
  const navigate = useNavigate()
  const choice = readAgeChoice()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')

  if (choice === 'no') return <Navigate to="/exit" replace />
  if (choice !== 'yes') return <Navigate to="/" replace />
  if (hasSession()) return <Navigate to={pathAfterLogin()} replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || password.length < 8) {
      setNotice('Enter your email and a password of at least 8 characters.')
      return
    }
    const message = await login(email, password)
    if (message) {
      setNotice(message)
      return
    }
    navigate(pathAfterLogin(), { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-8">
      <Link to="/" className="text-sm font-semibold text-mute">
        Back
      </Link>
      <h1 className="mt-6 text-[1.85rem] font-extrabold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm leading-6 text-mute">
        Use the email and password from your account.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
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
          autoComplete="current-password"
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
          Log in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-mute">
        New here?{' '}
        <Link to="/register" className="font-semibold text-coral">
          Create account
        </Link>
      </p>
    </div>
  )
}
