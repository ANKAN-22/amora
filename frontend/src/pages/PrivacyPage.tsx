import { ScreenHeader } from '@/components/ScreenHeader.tsx'
import { Toggle } from '@/components/Toggle.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'
import { updateSettings, useSettings } from '@/lib/settings.ts'

export function PrivacyPage() {
  usePageTitle('Privacy')
  const settings = useSettings()

  return (
    <div className="px-5 pt-4 pb-8">
      <ScreenHeader backTo="/settings" title="Privacy" subtitle="These change what your profile shows." />
      <div className="mt-5 grid gap-3">
        <Toggle
          checked={settings.showAge}
          label="Show my age"
          detail="Age stays on your profile while this is on."
          onChange={(showAge) => updateSettings({ showAge })}
        />
        <Toggle
          checked={settings.showCampus}
          label="Show department and year"
          detail="Your course and year stay on your profile while this is on."
          onChange={(showCampus) => updateSettings({ showCampus })}
        />
      </div>
    </div>
  )
}
