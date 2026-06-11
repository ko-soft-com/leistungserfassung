import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Task } from '../types/task'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn((...args: unknown[]) => args[0]),
  orderBy: vi.fn(),
}))

vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
}))

import { getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { getTasks, saveTask, updateTask, deleteTask } from './firestoreTasks'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    titel: 'Login Seite implementieren',
    beschreibung: '',
    status: 'Geplant',
    startedAt: null,
    endedAt: null,
    jiraTicketId: null,
    pullRequestId: null,
    history: [],
    faelligkeitsdatum: null,
    createdAt: '2026-06-11T08:00:00.000Z',
    updatedAt: '2026-06-11T08:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTasks', () => {
  it('returns empty array when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    expect(await getTasks()).toEqual([])
  })

  it('maps firestore docs to Task objects using doc.id', async () => {
    const task = makeTask()
    const { id, ...data } = task
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: 'firestore-id', data: () => data }],
    } as any)
    const result = await getTasks()
    expect(result[0].id).toBe('firestore-id')
    expect(result[0].titel).toBe('Login Seite implementieren')
    expect(result[0].status).toBe('Geplant')
  })

  it('fills missing fields with migration defaults', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: 'old-id', data: () => ({ titel: 'Alte Aufgabe' }) }],
    } as any)
    const result = await getTasks()
    expect(result[0].titel).toBe('Alte Aufgabe')
    expect(result[0].beschreibung).toBe('')
    expect(result[0].status).toBe('Geplant')
    expect(result[0].history).toEqual([])
    expect(result[0].startedAt).toBeNull()
    expect(result[0].endedAt).toBeNull()
    expect(result[0].jiraTicketId).toBeNull()
    expect(result[0].pullRequestId).toBeNull()
  })
})

describe('saveTask', () => {
  it('calls addDoc and returns task with firestore id', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-id' } as any)
    const result = await saveTask({
      titel: 'Neue Aufgabe', beschreibung: '', status: 'Geplant',
      startedAt: null, endedAt: null,
      jiraTicketId: null, pullRequestId: null, history: [],
    })
    expect(addDoc).toHaveBeenCalledOnce()
    expect(result.id).toBe('new-id')
    expect(result.titel).toBe('Neue Aufgabe')
    expect(result.createdAt).toBeTruthy()
  })
})

describe('updateTask', () => {
  it('calls updateDoc once', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined)
    await updateTask('task-1', { status: 'Fertig' })
    expect(updateDoc).toHaveBeenCalledOnce()
  })
})

describe('deleteTask', () => {
  it('calls deleteDoc with the correct reference', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined)
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    await deleteTask('task-1')
    expect(deleteDoc).toHaveBeenCalledWith('mock-ref')
  })
})
