import type { CampusStudent } from '@/data/students.ts'

type StudentAvatarProps = {
  student: CampusStudent
  className?: string
}

export function StudentAvatar({ student, className = '' }: StudentAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
      style={{ background: student.background }}
    >
      {student.name.charAt(0)}
    </span>
  )
}
