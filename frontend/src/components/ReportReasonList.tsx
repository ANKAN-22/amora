import { Button } from '@/components/Button.tsx'
import { reportReasons, type ReportReason } from '@/lib/social.ts'

type ReportReasonListProps = {
  onPick: (reason: ReportReason) => void
}

export function ReportReasonList({ onPick }: ReportReasonListProps) {
  return (
    <div className="grid gap-2">
      {reportReasons.map((reason) => (
        <Button key={reason} variant="secondary" fullWidth onClick={() => onPick(reason)}>
          {reason}
        </Button>
      ))}
    </div>
  )
}
