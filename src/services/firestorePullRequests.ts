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

function migratePr(raw: Record<string, unknown>, id: string): PullRequest {
  const data = { ...raw, id } as Record<string, unknown> & { id: string }
  if (!data.nummer && !data.titel && data.name) {
    data.nummer = ''
    data.titel = data.name as string
  }
  data.nummer ??= ''
  data.titel ??= ''
  data.reviewer ??= ''
  data.history ??= []
  data.faelligkeitsdatum ??= null
  return data as unknown as PullRequest
}

export async function getPullRequests(): Promise<PullRequest[]> {
  const uid = requireUid()
  const q = query(prsCol(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => migratePr(d.data() as Record<string, unknown>, d.id))
}

export async function savePullRequest(
  data: Omit<PullRequest, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<PullRequest> {
  const uid = requireUid()
  const now = new Date().toISOString()
  const payload = {
    ...data,
    reviewer: data.reviewer ?? '',
    history: data.history ?? [],
    createdAt: now,
    updatedAt: now,
  }
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
