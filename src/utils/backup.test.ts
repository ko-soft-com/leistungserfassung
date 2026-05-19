import { describe, it, expect } from 'vitest'
import { exportToJson, importFromJson } from './backup'
import type { TimeEntry } from '../types/entry'
import type { DayRecord } from '../types/dayRecord'

const entry: TimeEntry = {
  id: '1', date: '2026-05-19', start: '08:00', end: '09:30',
  client: 'WASCOSA', orderNo: 'SP 07', account: '#WX-225',
  task: 'Feature', description: 'Test', createdAt: 'x', updatedAt: 'x',
}
const dayRecord: DayRecord = {
  date: '2026-05-19', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30,
}

describe('exportToJson', () => {
  it('produces valid JSON with version, exportedAt, entries, dayRecords', () => {
    const json = exportToJson([entry], { '2026-05-19': dayRecord })
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(typeof parsed.exportedAt).toBe('string')
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].id).toBe('1')
    expect(parsed.dayRecords['2026-05-19']).toEqual(dayRecord)
  })

  it('handles empty inputs', () => {
    const json = exportToJson([], {})
    const parsed = JSON.parse(json)
    expect(parsed.entries).toEqual([])
    expect(parsed.dayRecords).toEqual({})
  })
})

describe('importFromJson', () => {
  it('round-trips an export', () => {
    const json = exportToJson([entry], { '2026-05-19': dayRecord })
    const { entries, dayRecords } = importFromJson(json)
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('1')
    expect(dayRecords['2026-05-19']).toEqual(dayRecord)
  })

  it('throws on invalid JSON string', () => {
    expect(() => importFromJson('not json')).toThrow('Die Datei ist kein gültiges JSON.')
  })

  it('throws when version field is missing', () => {
    expect(() => importFromJson('{"entries":[]}')).toThrow('Unbekanntes Backup-Format (kein version-Feld).')
  })

  it('returns empty collections for empty arrays/objects', () => {
    const json = exportToJson([], {})
    const { entries, dayRecords } = importFromJson(json)
    expect(entries).toEqual([])
    expect(dayRecords).toEqual({})
  })
})
