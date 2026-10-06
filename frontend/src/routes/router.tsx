import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell.tsx'
import { PublicShell } from '@/layouts/PublicShell.tsx'
import { AgePage } from '@/pages/AgePage.tsx'
import { ChatPage } from '@/pages/ChatPage.tsx'
import { DiscoverPage } from '@/pages/DiscoverPage.tsx'
import { ExitPage } from '@/pages/ExitPage.tsx'
import { HelpPage } from '@/pages/HelpPage.tsx'
import { LandingPage } from '@/pages/LandingPage.tsx'
import { LikesPage } from '@/pages/LikesPage.tsx'
import { LoginPage } from '@/pages/LoginPage.tsx'
import { MatchesPage } from '@/pages/MatchesPage.tsx'
import { NotificationsPage } from '@/pages/NotificationsPage.tsx'
import { PrivacyPage } from '@/pages/PrivacyPage.tsx'
import { ProfilePage } from '@/pages/ProfilePage.tsx'
import { ProfileSetupPage } from '@/pages/ProfileSetupPage.tsx'
import { SafetyPage } from '@/pages/SafetyPage.tsx'
import { SettingsPage } from '@/pages/SettingsPage.tsx'
import { StudentPage } from '@/pages/StudentPage.tsx'
import { SubscriptionPage } from '@/pages/SubscriptionPage.tsx'
import { RegisterPage } from '@/pages/RegisterPage.tsx'
import { VerifyQueuePage } from '@/pages/VerifyQueuePage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route index element={<LandingPage />} />
        <Route path="age" element={<AgePage />} />
        <Route path="exit" element={<ExitPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify" element={<VerifyQueuePage />} />
        <Route path="profile-setup" element={<ProfileSetupPage />} />
      </Route>
      <Route element={<AppShell />}>
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="student/:studentId" element={<StudentPage />} />
        <Route path="likes" element={<LikesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="chat/:matchId" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="safety" element={<SafetyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/privacy" element={<PrivacyPage />} />
        <Route path="settings/notifications" element={<NotificationsPage />} />
        <Route path="settings/subscription" element={<SubscriptionPage />} />
        <Route path="settings/help" element={<HelpPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
