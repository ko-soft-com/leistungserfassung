import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { JiraTicket } from '../types/jiraTicket'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function ticketsCol(uid: string) {
  return collection(db, 'users', uid, 'jiraTickets')
}

function ticketDoc(uid: string, id: string) {
  return doc(db, 'users', uid, 'jiraTickets', id)
}

function migrateTicket(raw: Record<string, unknown>, id: string): JiraTicket {
  const data = { ...raw, id } as Record<string, unknown> & { id: string }
  if (!data.nummer && !data.titel && data.name) {
    data.nummer = ''
    data.titel = data.name as string
  }
  data.nummer ??= ''
  data.titel ??= ''
  data.issueType ??= 'Task'
  data.beschreibung ??= ''
  data.faelligkeitsdatum ??= null
  return data as unknown as JiraTicket
}

export async function getJiraTickets(): Promise<JiraTicket[]> {
  const uid = requireUid()
  const q = query(ticketsCol(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => migrateTicket(d.data() as Record<string, unknown>, d.id))
}

export async function saveJiraTicket(
  data: Omit<JiraTicket, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<JiraTicket> {
  const uid = requireUid()
  const now = new Date().toISOString()
  const payload = {
    ...data,
    issueType: data.issueType ?? 'Task',
    beschreibung: data.beschreibung ?? '',
    createdAt: now,
    updatedAt: now,
  }
  const ref = await addDoc(ticketsCol(uid), payload)
  return { ...payload, id: ref.id }
}

export async function updateJiraTicket(
  id: string,
  data: Partial<Omit<JiraTicket, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const uid = requireUid()
  const now = new Date().toISOString()
  await updateDoc(ticketDoc(uid, id), { ...data, updatedAt: now })
}

export async function deleteJiraTicket(id: string): Promise<void> {
  const uid = requireUid()
  await deleteDoc(ticketDoc(uid, id))
}
