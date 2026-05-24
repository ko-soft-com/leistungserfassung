import { collection, getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import type { DayRecord } from '../types/dayRecord'

const COL = 'tageszeiten'

export async function getAllDayRecords(): Promise<Record<string, DayRecord>> {
  const snapshot = await getDocs(collection(db, COL))
  const result: Record<string, DayRecord> = {}
  for (const d of snapshot.docs) {
    result[d.id] = d.data() as DayRecord
  }
  return result
}

export async function saveDayRecord(
  date: string,
  data: Omit<DayRecord, 'date'>,
): Promise<DayRecord> {
  const record: DayRecord = { date, ...data }
  await setDoc(doc(db, COL, date), record)
  return record
}

export async function getDayRecord(date: string): Promise<DayRecord | null> {
  const snap = await getDoc(doc(db, COL, date))
  if (!snap.exists()) return null
  return snap.data() as DayRecord
}
