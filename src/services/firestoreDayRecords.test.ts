import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { DayRecord } from '../types/dayRecord'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
}))

vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
}))

import { getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import {
  getAllDayRecords,
  saveDayRecord,
  getDayRecord,
} from './firestoreDayRecords'

function makeRecord(overrides: Partial<DayRecord> = {}): DayRecord {
  return {
    date: '2026-05-22',
    workStart: '08:00',
    workEnd: '17:00',
    pauseMinutes: 30,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAllDayRecords', () => {
  it('returns empty object when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    const result = await getAllDayRecords()
    expect(result).toEqual({})
  })

  it('maps docs to Record<date, DayRecord> using doc.id as date key', async () => {
    const record = makeRecord({ date: '2026-05-22' })
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: '2026-05-22', data: () => record }],
    } as any)
    const result = await getAllDayRecords()
    expect(result['2026-05-22']).toEqual(record)
  })

  it('returns multiple records keyed by date', async () => {
    const r1 = makeRecord({ date: '2026-05-20' })
    const r2 = makeRecord({ date: '2026-05-22' })
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        { id: '2026-05-20', data: () => r1 },
        { id: '2026-05-22', data: () => r2 },
      ],
    } as any)
    const result = await getAllDayRecords()
    expect(Object.keys(result)).toHaveLength(2)
    expect(result['2026-05-20'].workStart).toBe('08:00')
  })
})

describe('saveDayRecord', () => {
  it('calls setDoc with date as document id', async () => {
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    vi.mocked(setDoc).mockResolvedValueOnce(undefined)
    const data = { workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 }
    const result = await saveDayRecord('2026-05-22', data)
    expect(setDoc).toHaveBeenCalledWith('mock-ref', { date: '2026-05-22', ...data })
    expect(result.date).toBe('2026-05-22')
    expect(result.workStart).toBe('08:00')
  })
})

describe('getDayRecord', () => {
  it('returns null when document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result).toBeNull()
  })

  it('returns DayRecord when document exists', async () => {
    const record = makeRecord()
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => record,
    } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result?.workStart).toBe('08:00')
    expect(result?.pauseMinutes).toBe(30)
  })
})
