import { describe, it, expect } from 'vitest'
import { applyFilter } from '../filter'
import type { TimeEntry } from '../../types/entry'

const entries: TimeEntry[] = [
  { id: '1', date: '2026-05-12', start: '08:00', end: '09:00', client: 'WASCOSA', orderNo: 'SP 07', account: 'Dev', task: 'Feature', description: 'Auth', createdAt: '', updatedAt: '' },
  { id: '2', date: '2026-05-11', start: '10:00', end: '11:00', client: 'ACME', orderNo: 'AC 01', account: 'QA', task: 'Bug-Fixing', description: 'Login fix', createdAt: '', updatedAt: '' },
]

describe('applyFilter', () => {
  it('filters by search string in description', () => {
    const result = applyFilter(entries, { search: 'Auth' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by client', () => {
    const result = applyFilter(entries, { client: 'ACME' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('returns all when no filter', () => {
    expect(applyFilter(entries, {})).toHaveLength(2)
  })
})
