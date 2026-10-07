import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { logoutAdmin } from '@/lib/admin.ts'
import { reviewSummary } from '@/lib/review.ts'

export function AdminHomePage() {
  usePageTitle('Review')
  const navigate = useNavigate()
  const [summary, setSummary] = useState({ pending: 0, students: 0, openReports: 0 })

  useEffect(() => {
    void reviewSummary().then(setSummary)
  }, [])

  const cards = [
    {
      to: '/admin/verification',
      title: 'Verification',
      detail: summary.pending === 1 ? '1 waiting' : `${summary.pending} waiting`,
    },
    {
      to: '/admin/users',
      title: 'Users',
      detail: summary.students === 1 ? '1 student' : `${summary.students} students`,
    },
    {
      to: '/admin/reports',
      title: 'Reports',
      detail: summary.openReports === 1 ? '1 open' : `${summary.openReports} open`,
    },
  ]

  return (
    <div className="px-5 pt-2 pb-8">
      <h1 className="text-[1.65rem] font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm leading-5 text-mute">Students, screenshots, and reports from every phone.</p>
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
          void logoutAdmin().then(() => navigate('/admin/login', { replace: true }))
        }}
      >
        Log out
      </button>
    </div>
  )
}
