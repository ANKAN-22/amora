import { BadgeCheck, EyeOff, GraduationCap, Shield, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark.tsx'
import { Button } from '@/components/Button.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { readAgeChoice } from '@/lib/ageGate.ts'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'how', label: 'How it works' },
  { id: 'safety', label: 'Safety' },
  { id: 'privacy', label: 'Privacy' },
]

const steps = [
  {
    title: 'Create your account',
    body: 'Name, email, and your MAKAUT details.',
  },
  {
    title: 'Prove you’re enrolled',
    body: 'Upload a portal screenshot. An admin reviews it before you can browse.',
  },
  {
    title: 'Discover on campus',
    body: 'Like, match, and chat with verified students.',
  },
]

const safetyPoints = [
  { icon: Shield, title: '18+ only', body: 'Amora is for adult students.' },
  {
    icon: BadgeCheck,
    title: 'Verified before Discover',
    body: 'You wait for approval. Browsing stays closed until then.',
  },
  { icon: EyeOff, title: 'Block, report, hide', body: 'Safety tools sit on their own, not only inside chat.' },
]

const privacyPoints = [
  { icon: GraduationCap, title: 'One campus', body: 'Built for MAKAUT students, and nobody else right now.' },
  {
    icon: BadgeCheck,
    title: 'Private enrollment proof',
    body: 'Your portal screenshot is for review, not a public photo.',
  },
  { icon: Trash2, title: 'Delete your account', body: 'You can remove your account when you want to leave.' },
]

export function LandingPage() {
  usePageTitle('Welcome')
  const navigate = useNavigate()

  function continueTo(next: '/login' | '/register') {
    const choice = readAgeChoice()
    if (choice === 'yes') {
      navigate(next)
      return
    }
    if (choice === 'no') {
      navigate('/exit')
      return
    }
    navigate('/age', { state: { next } })
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="px-5 pt-10 pb-8">
      <div className="flex flex-col items-center text-center">
        <BrandMark />
        <h1 className="mt-4 text-[1.85rem] font-extrabold tracking-tight">Made for our campus</h1>
        <p className="mt-2 text-sm text-mute">Campus dating for MAKAUT students</p>
      </div>

      <div className="mt-6 rounded-[1.6rem] bg-blush px-4 py-4 text-center">
        <p className="text-sm leading-5 font-semibold text-ink">
          Amora is currently available only to students of MAKAUT.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        <Button fullWidth onClick={() => continueTo('/register')}>
          Create account
        </Button>
        <Button fullWidth variant="secondary" onClick={() => continueTo('/login')}>
          Log in
        </Button>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-mute">18+ only</p>

      <nav aria-label="On this page" className="mt-6 flex flex-wrap justify-center gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className="rounded-full bg-blush px-3 py-1.5 text-xs font-semibold text-ink"
          >
            {section.label}
          </button>
        ))}
      </nav>

      <section id="about" className="mt-6 scroll-mt-4">
        <h2 className="text-lg font-extrabold">About</h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Amora is a dating app made for our campus. You join as a MAKAUT student, confirm that
          you’re enrolled, and only then discover people here.
        </p>
      </section>

      <section id="how" className="mt-6 scroll-mt-4">
        <h2 className="text-lg font-extrabold">How it works</h2>
        <ol className="mt-3 grid gap-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-[1.4rem] bg-blush px-4 py-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-coral">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-bold">{step.title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-mute">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section id="safety" className="mt-6 scroll-mt-4">
        <h2 className="text-lg font-extrabold">Safety</h2>
        <ul className="mt-3 grid gap-3">
          {safetyPoints.map((point) => (
            <Point key={point.title} {...point} />
          ))}
        </ul>
      </section>

      <section id="privacy" className="mt-6 scroll-mt-4">
        <h2 className="text-lg font-extrabold">Privacy</h2>
        <ul className="mt-3 grid gap-3">
          {privacyPoints.map((point) => (
            <Point key={point.title} {...point} />
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-3">
        <Button fullWidth onClick={() => continueTo('/register')}>
          Create account
        </Button>
        <Button fullWidth variant="secondary" onClick={() => continueTo('/login')}>
          Log in
        </Button>
      </div>
    </div>
  )
}

function Point({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Shield
  title: string
  body: string
}) {
  return (
    <li className="flex gap-3 rounded-[1.4rem] bg-blush px-4 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-coral">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-mute">{body}</span>
      </span>
    </li>
  )
}
