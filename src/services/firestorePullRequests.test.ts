import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { PullRequest } from '../types/pullRequest'

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
  getPullRequests,
  savePullRequest,
  updatePullRequest,
  deletePullRequest,
} from './firestorePullRequests'

function makePr(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: 'pr-1',
    nummer: '42',
    titel: 'fix: SSO redirect',
    status: 'Open',
    kommentar: '',
    createdAt: '2026-06-04T10:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => { vi.clearAllMocks() })

describe('getPullRequests', () => {
  it('returns empty array when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    expect(await getPullRequests()).toEqual([])
  })

  it('maps firestore docs to PullRequest objects using doc.id', async () => {
    const pr = makePr()
    const { id, ...data } = pr
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: 'firestore-id', data: () => data }],
    } as any)
    const result = await getPullRequests()
    expect(result[0].id).toBe('firestore-id')
    expect(result[0].nummer).toBe('42')
    expect(result[0].titel).toBe('fix: SSO redirect')
  })
})

describe('savePullRequest', () => {
  it('calls addDoc and returns PR with firestore id', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-pr-id' } as any)
    const result = await savePullRequest({ nummer: '1', titel: 'fix: login', status: 'Open', kommentar: '' })
    expect(addDoc).toHaveBeenCalledOnce()
    expect(result.id).toBe('new-pr-id')
    expect(result.createdAt).toBeTruthy()
  })
})

describe('updatePullRequest', () => {
  it('calls updateDoc once', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined)
    await updatePullRequest('pr-1', { status: 'Merged' })
    expect(updateDoc).toHaveBeenCalledOnce()
  })
})

describe('deletePullRequest', () => {
  it('calls deleteDoc with the correct reference', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined)
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    await deletePullRequest('pr-1')
    expect(deleteDoc).toHaveBeenCalledWith('mock-ref')
  })
})
