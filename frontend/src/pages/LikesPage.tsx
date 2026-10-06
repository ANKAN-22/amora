import { Eye, Heart } from 'lucide-react'
import { Card } from '@/components/Card.tsx'
import { PageHeading } from '@/components/PageHeading.tsx'
import { usePageTitle } from '@/hooks/usePageTitle.ts'

const sections = [
  {
    title: 'People you liked',
    detail: 'No likes yet.',
    icon: Heart,
  },
  {
    title: 'People who liked you',
    detail: 'When someone likes you, they show up here.',
    icon: Eye,
  },
]

export function LikesPage() {
  usePageTitle('Likes')

  return (
    <div className="px-5 pt-2 pb-6">
      <PageHeading title="Likes" subtitle="People you notice, and people who notice you." />
      <div className="mt-5 grid gap-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="flex items-center gap-3 p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blush text-coral">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{section.title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-mute">{section.detail}</span>
              </span>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
