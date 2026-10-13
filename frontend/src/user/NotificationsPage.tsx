import { ScreenHeader } from '@/shared/ScreenHeader.tsx'
import { Toggle } from '@/shared/Toggle.tsx'
import { usePageTitle } from '@/shared/usePageTitle.ts'
import { updateSettings, useSettings } from '@/lib/settings.ts'

export function NotificationsPage() {
  usePageTitle('Notifications')
  const settings = useSettings()

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/settings" title="Notifications" subtitle="These follow your account." />
      <div className="mt-5 grid gap-3">
        <Toggle
          checked={settings.notifyLikes}
          label="Likes"
          detail="Show the count on the Likes tab."
          onChange={(notifyLikes) => updateSettings({ notifyLikes })}
        />
        <Toggle
          checked={settings.notifyMatches}
          label="Matches"
          detail="Show the count on the Matches tab."
          onChange={(notifyMatches) => updateSettings({ notifyMatches })}
        />
        <Toggle
          checked={settings.notifyMessages}
          label="Messages"
          detail="Include unread chats in the Matches tab count."
          onChange={(notifyMessages) => updateSettings({ notifyMessages })}
        />
      </div>
    </div>
  )
}
