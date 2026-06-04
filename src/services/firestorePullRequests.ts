import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { PullRequest } from '../types/pullRequest'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function prsCol(uid: string) {
  return collection(db, 'users', uid, 'pullRequests')
}

function prDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'pullRequests', id)
}

export async function getPullRequests(): Promise<PullRequest[]> {
  const uid = requireUid()
  const q = query(prsCol(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as PullRequest)
}

export async function savePullRequest(
  data: Omit<PullRequest, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<PullRequest> {
  const uid = requireUid()
  const now = new Date().toISOString()
  const payload = { ...data, createdAt: now, updatedAt: now }
  const ref = await addDoc(prsCol(uid), payload)
  return { ...payload, id: ref.id }
}

export async function updatePullRequest(
  id: string,
  data: Partial<Omit<PullRequest, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const uid = requireUid()
  const now = new Date().toISOString()
  await updateDoc(prDoc(uid, id), { ...data, updatedAt: now })
}

export async function deletePullRequest(id: string): Promise<void> {
  const uid = requireUid()
  await deleteDoc(prDoc(uid, id))
}
