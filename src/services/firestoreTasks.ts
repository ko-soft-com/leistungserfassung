import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { Task } from '../types/task'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function tasksCol(uid: string) {
  return collection(db, 'users', uid, 'tasks')
}

function taskDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'tasks', id)
}

function migrateTask(raw: Record<string, unknown>, id: string): Task {
  const data = { ...raw, id } as Record<string, unknown> & { id: string }
  data.titel ??= ''
  data.beschreibung ??= ''
  data.status ??= 'Geplant'
  data.startedAt ??= null
  data.endedAt ??= null
  data.jiraTicketId ??= null
  data.pullRequestId ??= null
  data.history ??= []
  return data as unknown as Task
}

export async function getTasks(): Promise<Task[]> {
  const uid = requireUid()
  const q = query(tasksCol(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => migrateTask(d.data() as Record<string, unknown>, d.id))
}

export async function saveTask(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Task> {
  const uid = requireUid()
  const now = new Date().toISOString()
  const payload = { ...data, history: data.history ?? [], createdAt: now, updatedAt: now }
  const ref = await addDoc(tasksCol(uid), payload)
  return { ...payload, id: ref.id }
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const uid = requireUid()
  const now = new Date().toISOString()
  await updateDoc(taskDoc(uid, id), { ...data, updatedAt: now })
}

export async function deleteTask(id: string): Promise<void> {
  const uid = requireUid()
  await deleteDoc(taskDoc(uid, id))
}
