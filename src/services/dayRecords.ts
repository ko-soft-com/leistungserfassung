import type { DayRecord } from '../types/dayRecord'

const DAY_RECORDS_KEY = 'day-records'

function getAll(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(DAY_RECORDS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DayRecord>) : {}
  } catch {
    return {}
  }
}

export function getDayRecord(date: string): DayRecord | null {
  return getAll()[date] ?? null
}

export function saveDayRecord(
  date: string,
  data: Omit<DayRecord, 'date'>
): DayRecord {
  const all = getAll()
  const record: DayRecord = { date, ...data }
  all[date] = record
  try {
    localStorage.setItem(DAY_RECORDS_KEY, JSON.stringify(all))
  } catch (e) {
    throw new Error(`Failed to persist day record: ${e}`)
  }
  return record
}

export function getAllDayRecords(): Record<string, DayRecord> {
  return getAll()
}
