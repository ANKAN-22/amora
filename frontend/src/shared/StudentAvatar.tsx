type StudentAvatarProps = {
  student: { name: string; background: string; photoUrls?: string[] }
  className?: string
}

export function StudentAvatar({ student, className = '' }: StudentAvatarProps) {
  const photo = student.photoUrls?.[0]
  if (photo) {
    return <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
  }

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
