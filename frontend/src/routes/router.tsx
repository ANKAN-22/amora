import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell.tsx'
import { DiscoverPage } from '@/pages/DiscoverPage.tsx'
import { LikesPage } from '@/pages/LikesPage.tsx'
import { MatchesPage } from '@/pages/MatchesPage.tsx'
import { ProfilePage } from '@/pages/ProfilePage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/discover" replace />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="likes" element={<LikesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Route>
    </Routes>
  )
}
