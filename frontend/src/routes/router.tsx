import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell.tsx'
import { PublicShell } from '@/layouts/PublicShell.tsx'
import { AgePage } from '@/pages/AgePage.tsx'
import { DiscoverPage } from '@/pages/DiscoverPage.tsx'
import { ExitPage } from '@/pages/ExitPage.tsx'
import { LandingPage } from '@/pages/LandingPage.tsx'
import { LikesPage } from '@/pages/LikesPage.tsx'
import { LoginPage } from '@/pages/LoginPage.tsx'
import { MatchesPage } from '@/pages/MatchesPage.tsx'
import { ProfilePage } from '@/pages/ProfilePage.tsx'
import { RegisterPage } from '@/pages/RegisterPage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route index element={<LandingPage />} />
        <Route path="age" element={<AgePage />} />
        <Route path="exit" element={<ExitPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route element={<AppShell />}>
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="likes" element={<LikesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
