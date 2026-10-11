import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { loadDashboardStats, type DashboardStats } from '@/admin/review.ts'
import { useAdminDataVersion } from '@/admin/refresh.ts'
import { errorMessage, formatMoney } from '@/admin/format.ts'
import { Loading, Notice, PageTitle, StatCard } from '@/admin/ui.tsx'

export function AdminHomePage() {
  usePageTitle('Dashboard')
  const version = useAdminDataVersion()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setStats(await loadDashboardStats())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, version])

  const revenue =
    stats && stats.revenue.length > 0 ? stats.revenue.map((item) => formatMoney(item.minor, item.currency)).join(' + ') : '0'

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Live counts from your Supabase database." />
      <Notice notice={error ? { kind: 'error', text: `${error} If this mentions a missing table or column, run the admin migration SQL first.` } : null} />
      {!stats && !error ? <Loading /> : null}
      {stats ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} hint="Student accounts (admins excluded)" />
            <StatCard label="Verified students" value={stats.verified} />
            <StatCard label="Pending verifications" value={stats.pending} />
            <StatCard label="Banned users" value={stats.banned} tone={stats.banned > 0 ? 'bad' : 'neutral'} />
            <StatCard label="Active premium" value={stats.activePremium} hint="Active and not past expiry" />
            <StatCard label="Open reports" value={stats.openReports} />
            <StatCard label="Successful payments" value={stats.successfulPayments} />
            <StatCard label="Revenue" value={revenue} hint="Sum of successful payment records" />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-coral-deep">
            <Link to="/admin/verification">Review verifications →</Link>
            <Link to="/admin/reports">Open reports →</Link>
            <Link to="/admin/users">Manage users →</Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
