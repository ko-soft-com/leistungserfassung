import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { TimeEntry } from '../types/entry'

const COL = 'eintraege'

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
  const payload = { ...data, createdAt: now, updatedAt: now }
  const ref = await addDoc(collection(db, COL), payload)
  return { id: ref.id, ...payload }
}

export async function updateTimeEntry(
  id: string,
  data: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<TimeEntry | null> {
  const ref = doc(db, COL, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const now = new Date().toISOString()
  const updates = { ...data, updatedAt: now }
  await updateDoc(ref, updates)
  return { id, ...(snap.data() as Omit<TimeEntry, 'id'>), ...updates }
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
