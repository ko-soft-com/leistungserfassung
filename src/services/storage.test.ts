import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEintraege,
  saveEintrag,
  updateEintrag,
  deleteEintrag,
  saveTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
} from './storage'
import type { EintragFormData } from '../types/entry'

const mockFormData: EintragFormData = {
  auftraggeber: 'Kunde A',
  auftragsnummer: 'AU-001',
  auftrag: 'Website',
  zeitkonto: 'ZK-01',
  aufgabe: 'Frontend',
  datum: '2026-05-11',
  dauer: { stunden: 2, minuten: 30 },
}

const STORAGE_KEY = 'leistungserfassung_eintraege'

beforeEach(() => {
  // Clear localStorage manually since .clear() may not be available in some test environments
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    localStorage.removeItem(key)
  }
  vi.restoreAllMocks()
})

describe('getEintraege', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getEintraege()).toEqual([])
  })

  it('returns empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')
    expect(getEintraege()).toEqual([])
  })

  it('returns sorted entries by datum descending', () => {
    const e1 = saveEintrag({ ...mockFormData, datum: '2026-01-01' })
    const e2 = saveEintrag({ ...mockFormData, datum: '2026-05-11' })
    const result = getEintraege()
    expect(result[0].id).toBe(e2.id)
    expect(result[1].id).toBe(e1.id)
  })
})

describe('saveEintrag', () => {
  it('saves an entry and returns it with id and createdAt', () => {
    const saved = saveEintrag(mockFormData)
    expect(saved.id).toBeTruthy()
    expect(saved.createdAt).toBeGreaterThan(0)
    expect(saved.auftraggeber).toBe('Kunde A')
  })

  it('accumulates multiple entries', () => {
    saveEintrag(mockFormData)
    saveEintrag({ ...mockFormData, auftraggeber: 'Kunde B' })
    expect(getEintraege()).toHaveLength(2)
  })
})

describe('updateEintrag', () => {
  it('updates an existing entry', () => {
    const saved = saveEintrag(mockFormData)
    const updated = updateEintrag(saved.id, { ...mockFormData, auftraggeber: 'Updated' })
    expect(updated?.auftraggeber).toBe('Updated')
    expect(getEintraege()[0].auftraggeber).toBe('Updated')
  })

  it('returns null when id not found', () => {
    const result = updateEintrag('nonexistent', mockFormData)
    expect(result).toBeNull()
  })
})

describe('deleteEintrag', () => {
  it('removes entry from storage', () => {
    const saved = saveEintrag(mockFormData)
    deleteEintrag(saved.id)
    expect(getEintraege()).toHaveLength(0)
  })

  it('does nothing when id not found', () => {
    saveEintrag(mockFormData)
    deleteEintrag('nonexistent')
    expect(getEintraege()).toHaveLength(1)
  })
})

describe('updateTimeEntry', () => {
  beforeEach(() => {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      localStorage.removeItem(key)
    }
    vi.restoreAllMocks()
  })

  it('updates a field on an existing entry', () => {
    const created = saveTimeEntry({
      date: '2026-05-12', start: '09:00', end: '10:00',
      client: 'WASCOSA', orderNo: 'SP01', account: 'Dev',
      task: 'Feature', description: 'Original',
    })
    const updated = updateTimeEntry(created.id, { client: 'Updated Client' })
    expect(updated).not.toBeNull()
    expect(updated!.client).toBe('Updated Client')
    expect(updated!.description).toBe('Original')
  })

  it('returns null for unknown id', () => {
    expect(updateTimeEntry('nonexistent', { client: 'x' })).toBeNull()
  })

  it('persists the update to storage', () => {
    const created = saveTimeEntry({
      date: '2026-05-12', start: '09:00', end: '10:00',
      client: 'A', orderNo: 'X', account: 'Y',
      task: 'Feature', description: 'test',
    })
    updateTimeEntry(created.id, { client: 'B' })
    const all = getTimeEntries()
    expect(all.find(e => e.id === created.id)?.client).toBe('B')
  })
})

describe('deleteTimeEntry', () => {
  beforeEach(() => {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      localStorage.removeItem(key)
    }
    vi.restoreAllMocks()
  })

  it('removes the entry from storage', () => {
    const e1 = saveTimeEntry({ date: '2026-05-12', start: '09:00', end: '10:00', client: 'A', orderNo: 'X', account: 'Y', task: 'Feature', description: 'delete me' })
    const e2 = saveTimeEntry({ date: '2026-05-12', start: '11:00', end: '12:00', client: 'B', orderNo: 'Z', account: 'W', task: 'Feature', description: 'keep me' })
    deleteTimeEntry(e1.id)
    const remaining = getTimeEntries()
    expect(remaining.some(e => e.id === e1.id)).toBe(false)
    expect(remaining.some(e => e.id === e2.id)).toBe(true)
  })

  it('is a noop for unknown id', () => {
    saveTimeEntry({ date: '2026-05-12', start: '09:00', end: '10:00', client: 'A', orderNo: 'X', account: 'Y', task: 'Feature', description: 'stay' })
    deleteTimeEntry('nonexistent')
    expect(getTimeEntries()).toHaveLength(1)
  })
})
