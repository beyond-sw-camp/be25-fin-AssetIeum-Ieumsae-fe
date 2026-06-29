export function toDateInputValue(date: Date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function toFutureLocalDateTimeValue(value: string, now: Date = new Date()) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    if (trimmedValue === toDateInputValue(now)) {
      const futureDate = new Date(now.getTime() + 60_000)
      return formatLocalDateTime(futureDate)
    }

    return `${trimmedValue}T${formatLocalTime(now)}`
  }

  return trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue
}

export function toLocalDateTimeWithCurrentTimeValue(value: string, now: Date = new Date()) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}T${formatLocalTime(now)}`
  }

  return trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue
}

function formatLocalDateTime(date: Date) {
  return `${toDateInputValue(date)}T${formatLocalTime(date)}`
}

function formatLocalTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}
