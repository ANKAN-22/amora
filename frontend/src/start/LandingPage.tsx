import { BadgeCheck, EyeOff, GraduationCap, Shield, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartMark } from '@/shared/BrandMark.tsx'
import { Button } from '@/shared/Button.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { readAgeChoice } from '@/lib/ageGate.ts'

const frame = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
const heading = 'font-serif text-3xl font-normal tracking-tight'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'how', label: 'How it works' },
  { id: 'safety', label: 'Safety' },
  { id: 'privacy', label: 'Privacy' },
]

const steps = [
  {
    title: 'Create Your Profile',
    body: 'Add your name, a short introduction, and your MAKAUT details. Enrollment is reviewed before you can browse.',
  },
  {
    title: 'Discover Your Person',
    body: 'Meet verified students from your own campus.',
  },
  {
    title: 'Match & Connect',
    body: 'When you both feel the same way, you can match and start a conversation.',
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
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const header = headerRef.current
    const scroller = header?.closest('main')
    if (!header || !(scroller instanceof HTMLElement)) return

    const apply = () => {
      scroller.style.scrollPaddingTop = `${header.offsetHeight + 16}px`
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(header)
    return () => {
      observer.disconnect()
      scroller.style.scrollPaddingTop = ''
    }
  }, [])

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
    <div className="min-w-0">
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b border-wine/10 bg-ivory/95 pt-[env(safe-area-inset-top)] backdrop-blur-md"
      >
        <div className={`${frame} flex flex-col items-center gap-1 py-3 lg:py-4`}>
          <span className="inline-flex shrink-0 items-center gap-2.5 text-wine">
            <HeartMark className="size-5" />
            <span className="font-serif text-2xl leading-none tracking-tight text-ink">Amora</span>
            <HeartMark className="size-5" />
          </span>
          <div className="relative flex w-full items-center justify-center">
            <nav aria-label="On this page" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-wine/80 transition-colors hover:text-wine"
                >
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="absolute right-0 hidden items-center gap-3 lg:flex">
              <Button variant="secondary" onClick={() => continueTo('/login')}>
                Log in
              </Button>
              <Button variant="editorial" onClick={() => continueTo('/register')}>
                Create account
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-blush/40">
        <div className={`${frame} flex flex-col items-center py-16 text-center sm:py-20 lg:py-28`}>
          <h1 className="max-w-3xl font-serif text-[1.85rem] leading-[1.15] font-normal tracking-tight text-ink min-[375px]:text-4xl sm:text-5xl sm:leading-[1.12] lg:text-6xl">
            Your next favourite love story starts here.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-mute sm:mt-6 sm:text-lg">
            Amora connects MAKAUT students who want to meet someone on their own campus.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button variant="editorial" className="w-full sm:w-auto" onClick={() => continueTo('/register')}>
              Create account
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => continueTo('/login')}>
              Log in
            </Button>
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wide text-mute uppercase">18+ only</p>
          <p className="mt-8 max-w-md border-t border-wine/15 pt-6 text-sm leading-6 text-ink">
            Amora is currently available only to students of MAKAUT.
          </p>
        </div>
      </section>

      <section className="border-t border-wine/10">
        <div className={`${frame} grid gap-4 py-12 sm:py-16 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-16 lg:py-24`}>
          <h2 id="about" className={heading}>
            About
          </h2>
          <p className="max-w-2xl text-base leading-7 text-ink sm:text-lg sm:leading-8">
            Amora is a dating app made for our campus. You join as a MAKAUT student, confirm that
            you’re enrolled, and only then discover people here.
          </p>
        </div>
      </section>

      <section className="border-t border-wine/10">
        <div className={`${frame} py-12 sm:py-16 lg:py-24`}>
          <h2 id="how" className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-mute">
            From your profile to a conversation, in three steps.
          </p>
          <ol className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-3 lg:gap-10">
            {steps.map((step, index) => (
              <li key={step.title} className="min-w-0 border-t border-wine/20 pt-5">
                <span className="font-serif text-3xl text-wine">0{index + 1}</span>
                <span className="mt-3 block text-base font-semibold">{step.title}</span>
                <span className="mt-2 block text-sm leading-6 text-mute">{step.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="border-t border-wine/10 bg-cream">
        <div className={`${frame} grid gap-12 py-12 sm:py-16 md:grid-cols-2 lg:gap-24 lg:py-24`}>
          <section className="min-w-0">
            <h2 id="safety" className={heading}>
              Safety
            </h2>
            <ul className="mt-2">
              {safetyPoints.map((point) => (
                <Point key={point.title} {...point} />
              ))}
            </ul>
          </section>
          <section className="min-w-0">
            <h2 id="privacy" className={heading}>
              Privacy
            </h2>
            <ul className="mt-2">
              {privacyPoints.map((point) => (
                <Point key={point.title} {...point} />
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="border-t border-wine/10">
        <div className={`${frame} flex flex-col gap-8 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:pt-16 sm:pb-[calc(4rem+env(safe-area-inset-bottom))]`}>
          <div className="min-w-0">
            <h2 className="font-serif text-3xl font-normal tracking-tight">Begin on campus</h2>
            <p className="mt-3 text-sm leading-6 text-mute">18+ only. MAKAUT students.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="editorial" className="w-full sm:w-auto" onClick={() => continueTo('/register')}>
              Create account
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => continueTo('/login')}>
              Log in
            </Button>
          </div>
        </div>
      </section>
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
    <li className="flex gap-4 border-b border-wine/10 py-5">
      <Icon className="mt-0.5 size-5 shrink-0 text-rose" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-mute">{body}</span>
      </span>
    </li>
  )
}
