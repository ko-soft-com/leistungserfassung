import { collection, getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import { db, auth } from './firebase'
import type { DayRecord, WorkSegment } from '../types/dayRecord'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function tagesDoc(uid: string, date: string) {
  return doc(db, 'users', uid, 'tageszeiten', date)
}

export function migrateDayRecord(raw: Record<string, unknown>): DayRecord {
  const date = raw.date as string
  if (Array.isArray(raw.segments)) {
    return { date, segments: raw.segments as WorkSegment[] }
  }
  const segments: WorkSegment[] = []
  if (raw.workStart && raw.workEnd) {
    segments.push({ start: raw.workStart as string, end: raw.workEnd as string })
  }
  return { date, segments }
}

export async function getAllDayRecords(): Promise<Record<string, DayRecord>> {
  const uid = requireUid()
  const snapshot = await getDocs(collection(db, 'users', uid, 'tageszeiten'))
  const result: Record<string, DayRecord> = {}
  for (const d of snapshot.docs) {
    result[d.id] = migrateDayRecord({ ...d.data(), date: d.id })
  }
  return result
}

export async function saveDayRecord(
  date: string,
  data: Omit<DayRecord, 'date'>,
): Promise<DayRecord> {
  const uid = requireUid()
  const record: DayRecord = { date, ...data }
  await setDoc(tagesDoc(uid, date), record)
  return record
}

export async function getDayRecord(date: string): Promise<DayRecord | null> {
  const uid = requireUid()
  const snap = await getDoc(tagesDoc(uid, date))
  if (!snap.exists()) return null
  return migrateDayRecord({ ...snap.data(), date })
}
