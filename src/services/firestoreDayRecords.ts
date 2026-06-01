import { collection, getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import { db, auth } from './firebase'
import type { DayRecord } from '../types/dayRecord'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function tagesDoc(uid: string, date: string) {
  return doc(db, 'users', uid, 'tageszeiten', date)
}

export async function getAllDayRecords(): Promise<Record<string, DayRecord>> {
  const uid = requireUid()
  const snapshot = await getDocs(collection(db, 'users', uid, 'tageszeiten'))
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
  const uid = requireUid()
  const record: DayRecord = { date, ...data }
  await setDoc(tagesDoc(uid, date), record)
  return record
}

export async function getDayRecord(date: string): Promise<DayRecord | null> {
  const uid = requireUid()
  const snap = await getDoc(tagesDoc(uid, date))
  if (!snap.exists()) return null
  return snap.data() as DayRecord
}
