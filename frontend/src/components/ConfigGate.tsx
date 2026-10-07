import type { ReactNode } from 'react'
import { PhoneFrame } from '@/layouts/PhoneFrame.tsx'
import { useSession } from '@/lib/account.ts'

export function ConfigGate({ children }: { children: ReactNode }) {
  const session = useSession()

  if (!session.configured) {
    return (
      <PhoneFrame>
        <div className="px-6 py-10">
          <p className="text-xs font-semibold tracking-wide text-mute uppercase">Supabase</p>
          <h1 className="mt-2 text-[1.7rem] font-extrabold tracking-tight">Connect the database</h1>
          <p className="mt-3 text-sm leading-6 text-mute">
            Create a free Supabase project, run supabase/schema.sql in the SQL editor, then put the project URL and
            anon key in frontend/.env. Restart npm run dev after saving the file.
          </p>
        </div>
      </PhoneFrame>
    )
  }

  if (!session.ready) {
    return (
      <PhoneFrame>
        <p className="px-6 py-10 text-sm text-mute">Loading…</p>
      </PhoneFrame>
    )
  }

  return children
}
