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
  migrateDayRecord,
} from './firestoreDayRecords'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('migrateDayRecord', () => {
  it('returns new-format record unchanged when segments array present', () => {
    const raw = { date: '2026-06-01', segments: [{ start: '08:00', end: '12:00' }] }
    expect(migrateDayRecord(raw)).toEqual({
      date: '2026-06-01',
      segments: [{ start: '08:00', end: '12:00' }],
    })
  })

  it('converts legacy workStart/workEnd to single segment', () => {
    const raw = { date: '2026-06-01', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 }
    expect(migrateDayRecord(raw)).toEqual({
      date: '2026-06-01',
      segments: [{ start: '08:00', end: '17:00' }],
    })
  })

  it('drops legacy workStart/workEnd/pauseMinutes fields after migration', () => {
    const raw = { date: '2026-06-01', workStart: '09:00', workEnd: '18:00', pauseMinutes: 60 }
    const result = migrateDayRecord(raw)
    expect(result.workStart).toBeUndefined()
    expect(result.workEnd).toBeUndefined()
    expect(result.pauseMinutes).toBeUndefined()
  })

  it('returns empty segments when no time data present', () => {
    const raw = { date: '2026-06-01' }
    expect(migrateDayRecord(raw)).toEqual({ date: '2026-06-01', segments: [] })
  })

  it('returns empty segments when only workStart is set (no workEnd)', () => {
    const raw = { date: '2026-06-01', workStart: '08:00' }
    expect(migrateDayRecord(raw)).toEqual({ date: '2026-06-01', segments: [] })
  })
})

describe('getAllDayRecords', () => {
  it('returns empty object when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    const result = await getAllDayRecords()
    expect(result).toEqual({})
  })

  it('migrates legacy record on read and keys by date', async () => {
    const raw = { date: '2026-05-22', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 }
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: '2026-05-22', data: () => raw }],
    } as any)
    const result = await getAllDayRecords()
    expect(result['2026-05-22'].segments).toEqual([{ start: '08:00', end: '17:00' }])
    expect(result['2026-05-22'].workStart).toBeUndefined()
  })

  it('returns multiple records keyed by date', async () => {
    const r1 = { date: '2026-05-20', segments: [{ start: '09:00', end: '17:00' }] }
    const r2 = { date: '2026-05-22', segments: [{ start: '08:00', end: '16:00' }] }
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        { id: '2026-05-20', data: () => r1 },
        { id: '2026-05-22', data: () => r2 },
      ],
    } as any)
    const result = await getAllDayRecords()
    expect(Object.keys(result)).toHaveLength(2)
    expect(result['2026-05-20'].segments[0].start).toBe('09:00')
  })
})

describe('saveDayRecord', () => {
  it('calls setDoc with segments payload', async () => {
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    vi.mocked(setDoc).mockResolvedValueOnce(undefined)
    const data = { segments: [{ start: '08:00', end: '17:00' }] }
    const result = await saveDayRecord('2026-05-22', data)
    expect(setDoc).toHaveBeenCalledWith('mock-ref', { date: '2026-05-22', ...data })
    expect(result.date).toBe('2026-05-22')
    expect(result.segments).toEqual([{ start: '08:00', end: '17:00' }])
  })
})

describe('getDayRecord', () => {
  it('returns null when document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result).toBeNull()
  })

  it('migrates legacy record on read', async () => {
    const raw = { workStart: '09:00', workEnd: '18:00', pauseMinutes: 45 }
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => raw,
    } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result?.segments).toEqual([{ start: '09:00', end: '18:00' }])
    expect(result?.pauseMinutes).toBeUndefined()
  })

  it('returns new-format record unchanged', async () => {
    const record: DayRecord = {
      date: '2026-05-22',
      segments: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    }
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => record,
    } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result?.segments).toHaveLength(2)
  })
})
