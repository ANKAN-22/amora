import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '@/admin/AdminShell.tsx'
import { AppShell } from '@/user/AppShell.tsx'
import { PublicShell } from '@/start/PublicShell.tsx'
import { AdminHomePage } from '@/admin/AdminHomePage.tsx'
import { AdminLoginPage } from '@/admin/AdminLoginPage.tsx'
import { AdminPaymentsPage } from '@/admin/AdminPaymentsPage.tsx'
import { AdminReportsPage } from '@/admin/AdminReportsPage.tsx'
import { AdminSubscriptionsPage } from '@/admin/AdminSubscriptionsPage.tsx'
import { AdminUsersPage } from '@/admin/AdminUsersPage.tsx'
import { AdminVerificationPage } from '@/admin/AdminVerificationPage.tsx'
import { AgePage } from '@/start/AgePage.tsx'
import { ChatPage } from '@/user/ChatPage.tsx'
import { DiscoverPage } from '@/user/DiscoverPage.tsx'
import { ExitPage } from '@/start/ExitPage.tsx'
import { HelpPage } from '@/user/HelpPage.tsx'
import { LandingPage } from '@/start/LandingPage.tsx'
import { LikesPage } from '@/user/LikesPage.tsx'
import { LoginPage } from '@/start/LoginPage.tsx'
import { MatchesPage } from '@/user/MatchesPage.tsx'
import { NotificationsPage } from '@/user/NotificationsPage.tsx'
import { PrivacyPage } from '@/user/PrivacyPage.tsx'
import { ProfilePage } from '@/user/ProfilePage.tsx'
import { ProfileSetupPage } from '@/user/ProfileSetupPage.tsx'
import { SafetyPage } from '@/user/SafetyPage.tsx'
import { SettingsPage } from '@/user/SettingsPage.tsx'
import { StudentPage } from '@/user/StudentPage.tsx'
import { SubscriptionPage } from '@/user/SubscriptionPage.tsx'
import { RegisterPage } from '@/start/RegisterPage.tsx'
import { VerifyQueuePage } from '@/user/VerifyQueuePage.tsx'

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
      <Route element={<AdminShell />}>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminHomePage />} />
        <Route path="admin/verification" element={<AdminVerificationPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/reports" element={<AdminReportsPage />} />
        <Route path="admin/subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="admin/payments" element={<AdminPaymentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
