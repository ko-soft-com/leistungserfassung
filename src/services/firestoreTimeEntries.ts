import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { TimeEntry } from '../types/entry'

const COL = 'eintraege'

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const q = query(
    collection(db, COL),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as TimeEntry)
}

export async function saveTimeEntry(
  data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<TimeEntry> {
  const now = new Date().toISOString()
  const payload = stripUndefined({ ...data, createdAt: now, updatedAt: now })
  const ref = await addDoc(collection(db, COL), payload)
  return { id: ref.id, ...payload }
}

export async function updateTimeEntry(
  id: string,
  data: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const ref = doc(db, COL, id)
  const now = new Date().toISOString()
  const updates = stripUndefined({ ...data, updatedAt: now })
  await updateDoc(ref, updates)
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
