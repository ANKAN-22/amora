import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/Button.tsx'
import { TextField } from '@/shared/TextField.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { localAdmin, loginAdmin } from '@/admin/admin.ts'

export function AdminLoginPage() {
  usePageTitle('Review login')
  const navigate = useNavigate()
  const [email, setEmail] = useState(localAdmin.email)
  const [password, setPassword] = useState(localAdmin.password)
  const [notice, setNotice] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = await loginAdmin(email, password)
    if (message) {
      setNotice(message)
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
      <p className="mt-2 text-sm leading-6 break-words text-mute">
        {localAdmin.email && localAdmin.password
          ? `Reviewer email ${localAdmin.email} and password ${localAdmin.password}. This login is separate from a student account.`
          : 'This login is separate from a student account.'}
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
