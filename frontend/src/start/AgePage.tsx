import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/shared/BrandMark.tsx'
import { Button } from '@/shared/Button.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { readAgeChoice, saveAgeChoice } from '@/lib/ageGate.ts'

function nextPath(value: unknown) {
  return value === '/register' ? '/register' : '/login'
}

export function AgePage() {
  usePageTitle('18+')
  const navigate = useNavigate()
  const location = useLocation()
  const next = nextPath(
    typeof location.state === 'object' && location.state && 'next' in location.state
      ? location.state.next
      : '/login',
  )

  const choice = readAgeChoice()
  if (choice === 'yes') return <Navigate to={next} replace />
  if (choice === 'no') return <Navigate to="/exit" replace />

  function choose(answer: 'yes' | 'no') {
    saveAgeChoice(answer)
    navigate(answer === 'yes' ? next : '/exit', { replace: true })
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-6 pb-8">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="self-start text-sm font-semibold text-mute"
      >
        Back
      </button>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BrandMark />
        <h1 className="mt-6 text-[1.85rem] font-extrabold tracking-tight">18+ only</h1>
        <p className="mt-2 max-w-[16rem] text-sm leading-6 text-mute">
          Amora is only for students who are 18 or older.
        </p>
      </div>
      <div className="grid gap-3">
        <Button fullWidth onClick={() => choose('yes')}>
          Yes, I’m 18 or older
        </Button>
        <Button fullWidth variant="secondary" onClick={() => choose('no')}>
          No, I’m under 18
        </Button>
      </div>
    </div>
  )
}
