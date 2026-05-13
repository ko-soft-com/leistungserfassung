import type { TimeEntry } from '../types/entry'

export function isDuplicate(
  candidate: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
  existing: TimeEntry[]
): boolean {
  return existing.some(
    e =>
      e.date === candidate.date &&
      e.start === candidate.start &&
      e.end === candidate.end &&
      e.client === candidate.client &&
      e.orderNo === candidate.orderNo &&
      e.account === candidate.account &&
      e.task === candidate.task &&
      e.description === candidate.description
  )
}
