export function formatClock(time: string | null | undefined) {
  if (!time) return ''

  const date = new Date(time)

  if (Number.isNaN(date.getTime())) return ''

  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function formatRelativeTime(time: string | null | undefined) {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()

  if (Number.isNaN(date.getTime())) return ''

  const diff = now.getTime() - date.getTime()

  if (diff < 60_000) {
    return '刚刚'
  }

  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)}分钟前`
  }

  if (date.toDateString() === now.toDateString()) {
    return formatClock(time)
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
