import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getEintraege, saveEintrag, updateEintrag, deleteEintrag } from './storage'
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
