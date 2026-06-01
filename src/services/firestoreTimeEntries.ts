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
import { db, auth } from './firebase'
import type { TimeEntry } from '../types/entry'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function entriesCol(uid: string) {
  return collection(db, 'users', uid, 'eintraege')
}

function entryDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'eintraege', id)
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const uid = requireUid()
  const q = query(
    entriesCol(uid),
    orderBy('date', 'desc'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as TimeEntry)
}

export async function saveTimeEntry(
  data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<TimeEntry> {
  const uid = requireUid()
  const now = new Date().toISOString()
  const { id: _id, createdAt: _c, updatedAt: _u, ...safeData } = data as TimeEntry
  const payload = stripUndefined({ ...safeData, createdAt: now, updatedAt: now })
  const ref = await addDoc(entriesCol(uid), payload)
  return { ...payload, id: ref.id } as TimeEntry
}

export async function updateTimeEntry(
  id: string,
  data: Partial<Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const uid = requireUid()
  const ref = entryDoc(uid, id)
  const now = new Date().toISOString()
  const updates = stripUndefined({ ...data, updatedAt: now })
  await updateDoc(ref, updates)
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const uid = requireUid()
  await deleteDoc(entryDoc(uid, id))
}
