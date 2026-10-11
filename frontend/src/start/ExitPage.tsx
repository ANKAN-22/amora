import { useNavigate } from 'react-router-dom'
import { HeartMark } from '@/shared/BrandMark.tsx'
import { Button } from '@/shared/Button.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { clearAgeChoice } from '@/lib/ageGate.ts'

export function ExitPage() {
  usePageTitle('Unavailable')
  const navigate = useNavigate()

  function leave() {
    clearAgeChoice()
    navigate('/')
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 py-10 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-blush text-coral">
        <HeartMark className="size-10" />
      </span>
      <h1 className="mt-6 text-[1.7rem] font-extrabold tracking-tight">You can’t use Amora</h1>
      <p className="mt-2 max-w-[16rem] text-sm leading-6 text-mute">
        This app is only for students who are 18 or older.
      </p>
      <Button className="mt-8" variant="secondary" onClick={leave}>
        Back to Amora
      </Button>
    </div>
  )
}
