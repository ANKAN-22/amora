import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button.tsx'
import { TextField } from '@/components/TextField.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { localAdmin, loginAdmin } from '@/lib/admin.ts'

export function AdminLoginPage() {
  usePageTitle('Review login')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loginAdmin(email, password)) {
      setNotice('That reviewer login doesn’t match.')
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-8">
      <Link to="/" className="text-sm font-semibold text-mute">
        Home
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-wide text-mute uppercase">Admin</p>
      <h1 className="mt-1 text-[1.85rem] font-extrabold tracking-tight">Review login</h1>
      <p className="mt-2 text-sm leading-6 text-mute">
        This is separate from a student account. On this browser, sign in with {localAdmin.email} and {localAdmin.password}.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
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
    </div>
  )
}
