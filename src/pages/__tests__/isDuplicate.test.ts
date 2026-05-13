import { describe, it, expect } from 'vitest'
import { isDuplicate } from '../ErfassungPage'
import type { TimeEntry } from '../../types/entry'

const base: TimeEntry = {
  id: '1',
  date: '2026-05-12',
  start: '09:00',
  end: '10:00',
  client: 'Kunde A',
  orderNo: 'K-001',
  account: 'Entwicklung',
  task: 'Feature',
  description: 'Arbeit',
  createdAt: '2026-05-12T09:00:00.000Z',
  updatedAt: '2026-05-12T10:00:00.000Z',
}

const baseCandidate: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
  date: base.date,
  start: base.start,
  end: base.end,
  client: base.client,
  orderNo: base.orderNo,
  account: base.account,
  task: base.task,
  description: base.description,
}

describe('isDuplicate', () => {
  it('returns true for an exact match', () => {
    expect(isDuplicate(baseCandidate, [base])).toBe(true)
  })

  it('returns false when description differs', () => {
    const candidate = { ...baseCandidate, description: 'Anders' }
    expect(isDuplicate(candidate, [base])).toBe(false)
  })

  it('returns false for empty existing list', () => {
    expect(isDuplicate(baseCandidate, [])).toBe(false)
  })

  it('returns false when date differs', () => {
    const candidate = { ...baseCandidate, date: '2026-05-13' }
    expect(isDuplicate(candidate, [base])).toBe(false)
  })

  it('returns false when client differs', () => {
    const candidate = { ...baseCandidate, client: 'Anderer Kunde' }
    expect(isDuplicate(candidate, [base])).toBe(false)
  })

  it('returns true when matching entry is among multiple existing entries', () => {
    const other: TimeEntry = { ...base, id: '2', date: '2026-05-11' }
    expect(isDuplicate(baseCandidate, [other, base])).toBe(true)
  })

  it('returns true when both entries have end: null', () => {
    const existingNullEnd = { ...base, end: null }
    const candidateNullEnd = { ...baseCandidate, end: null }
    expect(isDuplicate(candidateNullEnd, [existingNullEnd as TimeEntry])).toBe(true)
  })

  it('returns false when candidate end is null and existing end is set', () => {
    const candidateNullEnd = { ...baseCandidate, end: null }
    expect(isDuplicate(candidateNullEnd, [base])).toBe(false)
  })
})
