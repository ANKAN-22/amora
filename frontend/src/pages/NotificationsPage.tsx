import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { Toggle } from '@/components/Toggle.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
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
          detail="Saved for message alerts."
          onChange={(notifyMessages) => updateSettings({ notifyMessages })}
        />
      </div>
    </div>
  )
}
