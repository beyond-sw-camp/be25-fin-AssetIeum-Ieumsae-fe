import type { InspectionStatus } from '@/types/inspection'

interface ResolveInspectionStatusOptions {
  startDate: string
  endDate: string
  fallbackStatus: InspectionStatus
  unrespondedCount?: number
  followUpCount?: number
  completedFollowUpCount?: number
  today?: Date
}

function startOfDay(date: Date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function parseDate(value: string) {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function resolveInspectionStatus({
  startDate,
  endDate,
  fallbackStatus,
  unrespondedCount,
  followUpCount,
  completedFollowUpCount,
  today = new Date(),
}: ResolveInspectionStatusOptions): InspectionStatus {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (!start || !end) return fallbackStatus

  const currentDay = startOfDay(today)
  const startDay = startOfDay(start)
  const endDay = startOfDay(end)

  if (currentDay < startDay) return 'READY'
  if (currentDay <= endDay) return 'IN_PROGRESS'

  if (unrespondedCount === undefined) {
    return fallbackStatus === 'COMPLETED' || fallbackStatus === 'CLOSED'
      ? fallbackStatus
      : 'IN_PROGRESS'
  }

  if (unrespondedCount > 0) return 'IN_PROGRESS'
  if (fallbackStatus === 'CLOSED') return 'CLOSED'

  const requiredCount = followUpCount ?? 0
  if (requiredCount === 0) return 'CLOSED'

  if (completedFollowUpCount === undefined) return 'COMPLETED'
  return completedFollowUpCount >= requiredCount ? 'CLOSED' : 'COMPLETED'
}
