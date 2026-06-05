import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { JiraTicket } from '../types/jiraTicket'

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
import {
  getJiraTickets,
  saveJiraTicket,
  updateJiraTicket,
  deleteJiraTicket,
} from './firestoreJiraTickets'

function makeTicket(overrides: Partial<JiraTicket> = {}): JiraTicket {
  return {
    id: 'ticket-1',
    nummer: 'AP-123',
    titel: 'Login fix',
    issueType: 'Task',
    status: 'Offen',
    beschreibung: '',
    kommentar: '',
    createdAt: '2026-06-04T10:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getJiraTickets', () => {
  it('returns empty array when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    expect(await getJiraTickets()).toEqual([])
  })

  it('maps firestore docs to JiraTicket objects using doc.id', async () => {
    const ticket = makeTicket()
    const { id, ...data } = ticket
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: 'firestore-id', data: () => data }],
    } as any)
    const result = await getJiraTickets()
    expect(result[0].id).toBe('firestore-id')
    expect(result[0].nummer).toBe('AP-123')
    expect(result[0].titel).toBe('Login fix')
  })
})

describe('saveJiraTicket', () => {
  it('calls addDoc and returns ticket with firestore id', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-id' } as any)
    const result = await saveJiraTicket({
      nummer: 'AP-1', titel: 'Test', issueType: 'Task',
      status: 'Offen', beschreibung: '', kommentar: '',
    })
    expect(addDoc).toHaveBeenCalledOnce()
    expect(result.id).toBe('new-id')
    expect(result.nummer).toBe('AP-1')
    expect(result.createdAt).toBeTruthy()
  })
})

describe('updateJiraTicket', () => {
  it('calls updateDoc once', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined)
    await updateJiraTicket('ticket-1', { status: 'Done' })
    expect(updateDoc).toHaveBeenCalledOnce()
  })
})

describe('deleteJiraTicket', () => {
  it('calls deleteDoc with the correct reference', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined)
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    await deleteJiraTicket('ticket-1')
    expect(deleteDoc).toHaveBeenCalledWith('mock-ref')
  })
})
