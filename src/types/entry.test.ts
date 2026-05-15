import { describe, it, expect } from 'vitest'
import type { Eintrag, Dauer, EintragFormData, TaskType } from './entry'

describe('Eintrag types', () => {
  it('Dauer has stunden and minuten', () => {
    const dauer: Dauer = { stunden: 2, minuten: 30 }
    expect(dauer.stunden).toBe(2)
    expect(dauer.minuten).toBe(30)
  })

  it('Eintrag has all required fields', () => {
    const entry: Eintrag = {
      id: 'abc-123',
      auftraggeber: 'Kunde A',
      auftragsnummer: 'AU-001',
      auftrag: 'Website Redesign',
      zeitkonto: 'ZK-2024',
      aufgabe: 'Frontend',
      datum: '2026-05-11',
      dauer: { stunden: 2, minuten: 30 },
      createdAt: 1715000000000,
    }
    expect(entry.id).toBe('abc-123')
    expect(entry.beschreibung).toBeUndefined()
    expect(entry.externeId).toBeUndefined()
  })

  it('EintragFormData omits id and createdAt', () => {
    const formData: EintragFormData = {
      auftraggeber: 'Kunde B',
      auftragsnummer: 'AU-002',
      auftrag: 'API',
      zeitkonto: 'ZK-2024',
      aufgabe: 'Backend',
      datum: '2026-05-11',
      dauer: { stunden: 1, minuten: 0 },
    }
    expect(formData.auftraggeber).toBe('Kunde B')
  })

  const TASK_TYPES = ['Bug-Fixing', 'Feature', 'Review', 'Meeting'] as const

  it('TaskType has exactly 4 valid values', () => {
    const tasks: TaskType[] = [...TASK_TYPES]
    expect(tasks).toHaveLength(4)
    expect(tasks).toContain('Feature')
    expect(tasks).toContain('Bug-Fixing')
  })
})
