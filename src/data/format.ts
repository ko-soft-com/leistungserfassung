import { format, parse, differenceInMinutes } from 'date-fns'
import { de } from 'date-fns/locale'
import type { TimeEntry } from '../types/entry'

export function fmtH(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}h`
}

export function fmtHshort(minutes: number): string {
  return fmtH(minutes)
}

export function fmtDateDE(isoDate: string): string {
  return format(new Date(isoDate + 'T00:00:00'), 'dd.MM.yyyy')
}

export function fmtTimestampDE(isoString: string): string {
  return format(new Date(isoString), 'dd.MM.yyyy HH:mm', { locale: de })
}

export function fmtDayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  const weekday = format(d, 'EEEE', { locale: de })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${fmtDateDE(isoDate)}`
}

export function durationMinutes(entry: Pick<TimeEntry, 'date' | 'start' | 'end'>): number {
  if (!entry.start) return 0
  const base = entry.date + 'T'
  const startDt = parse(base + entry.start, "yyyy-MM-dd'T'HH:mm", new Date())
  const endDt = entry.end
    ? parse(base + entry.end, "yyyy-MM-dd'T'HH:mm", new Date())
    : new Date()
  let diff = differenceInMinutes(endDt, startDt)
  if (diff < 0) diff += 24 * 60
  return diff
}
