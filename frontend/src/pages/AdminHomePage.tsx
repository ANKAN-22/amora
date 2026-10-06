import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { logoutAdmin } from '@/lib/admin.ts'
import { readAccount, statusLabel } from '@/lib/account.ts'
import { useSocial } from '@/lib/social.ts'

export function AdminHomePage() {
  usePageTitle('Review')
  const navigate = useNavigate()
  const account = readAccount()
  const social = useSocial()
  const openReports = social.reports.filter((report) => !report.resolved).length

  const cards = [
    {
      to: '/admin/verification',
      title: 'Verification',
      detail: account ? statusLabel(account.verificationStatus) : 'No student account yet',
    },
    {
      to: '/admin/users',
      title: 'Users',
      detail: account ? account.name : 'No student account yet',
    },
    {
      to: '/admin/reports',
      title: 'Reports',
      detail: openReports === 1 ? '1 open' : `${openReports} open`,
    },
  ]

  return (
    <div className="px-5 pt-2 pb-8">
      <h1 className="text-[1.65rem] font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm leading-5 text-mute">The student account and reports stored on this browser.</p>
      <div className="mt-5 grid gap-3">
        {cards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="px-4 py-4">
              <p className="font-bold">{card.title}</p>
              <p className="mt-0.5 text-sm text-mute">{card.detail}</p>
            </Card>
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 text-sm font-semibold text-mute"
        onClick={() => {
          logoutAdmin()
          navigate('/admin/login', { replace: true })
        }}
      >
        Log out
      </button>
    </div>
  )
}
