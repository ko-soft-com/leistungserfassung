import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { TimeEntry } from '../types/entry'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => args[0]),
  orderBy: vi.fn(),
}))

vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
}))

import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore'

import {
  getTimeEntries,
  saveTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from './firestoreTimeEntries'

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'id-1',
    date: '2026-05-22',
    start: '09:00',
    end: '10:00',
    client: 'Kunde A',
    orderNo: 'AU-001',
    account: 'ZK-01',
    task: 'Feature',
    description: 'Test',
    createdAt: '2026-05-22T09:00:00.000Z',
    updatedAt: '2026-05-22T09:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTimeEntries', () => {
  it('returns empty array when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    const result = await getTimeEntries()
    expect(result).toEqual([])
  })

  it('maps firestore docs to TimeEntry objects using doc.id', async () => {
    const entry = makeEntry({ id: 'ignored-by-test' })
    const { id, ...data } = entry
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: 'firestore-id', data: () => data }],
    } as any)
    const result = await getTimeEntries()
    expect(result[0].id).toBe('firestore-id')
    expect(result[0].client).toBe('Kunde A')
  })

  it('returns multiple entries', async () => {
    const e1 = makeEntry({ id: 'x', date: '2026-05-20', client: 'A' })
    const e2 = makeEntry({ id: 'y', date: '2026-05-22', client: 'B' })
    const toDoc = (e: TimeEntry) => {
      const { id, ...data } = e
      return { id, data: () => data }
    }
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [toDoc(e1), toDoc(e2)] } as any)
    const result = await getTimeEntries()
    expect(result).toHaveLength(2)
  })
})

describe('saveTimeEntry', () => {
  it('calls addDoc and returns entry with firestore id', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-firestore-id' } as any)
    const input = {
      date: '2026-05-22', start: '09:00', end: '10:00',
      client: 'Kunde A', orderNo: 'AU-001', account: 'ZK-01',
      task: 'Feature' as const, description: 'Test',
    }
    const result = await saveTimeEntry(input)
    expect(addDoc).toHaveBeenCalledOnce()
    expect(result.id).toBe('new-firestore-id')
    expect(result.client).toBe('Kunde A')
    expect(result.createdAt).toBeTruthy()
    expect(result.updatedAt).toBeTruthy()
  })
})

describe('updateTimeEntry', () => {
  it('throws when updateDoc rejects', async () => {
    vi.mocked(updateDoc).mockRejectedValueOnce(new Error('not-found'))
    await expect(updateTimeEntry('nonexistent', { client: 'X' })).rejects.toThrow()
  })

  it('calls updateDoc with stripped fields', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined)
    await updateTimeEntry('doc-1', { client: 'Updated' })
    expect(updateDoc).toHaveBeenCalledOnce()
  })
})

describe('deleteTimeEntry', () => {
  it('calls deleteDoc with the correct doc reference', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined)
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    await deleteTimeEntry('doc-1')
    expect(deleteDoc).toHaveBeenCalledWith('mock-ref')
  })
})
