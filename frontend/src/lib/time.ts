export function shortTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

export function sameTimeGroup(earlierIso: string, laterIso: string) {
  const earlier = new Date(earlierIso)
  const later = new Date(laterIso)
  const sameDay =
    earlier.getFullYear() === later.getFullYear() &&
    earlier.getMonth() === later.getMonth() &&
    earlier.getDate() === later.getDate()
  return sameDay && later.getTime() - earlier.getTime() < 15 * 60 * 1000
}
