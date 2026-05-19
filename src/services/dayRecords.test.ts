import { describe, it, expect, afterEach } from 'vitest'
import { getDayRecord, saveDayRecord } from './dayRecords'

describe('dayRecords', () => {
  afterEach(() => localStorage.clear())

  it('returns null when no record exists for a date', () => {
    expect(getDayRecord('2026-05-19')).toBeNull()
  })

  it('saves and retrieves a day record', () => {
    const saved = saveDayRecord('2026-05-19', {
      workStart: '08:00', workEnd: '17:00', pauseMinutes: 30,
    })
    expect(saved).toEqual({
      date: '2026-05-19', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30,
    })
    expect(getDayRecord('2026-05-19')).toEqual(saved)
  })

  it('overwrites existing record on save', () => {
    saveDayRecord('2026-05-19', { workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 })
    saveDayRecord('2026-05-19', { workStart: '09:00', workEnd: '18:00', pauseMinutes: 45 })
    expect(getDayRecord('2026-05-19')?.workStart).toBe('09:00')
  })

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('day-records', 'INVALID_JSON')
    expect(getDayRecord('2026-05-19')).toBeNull()
  })

  it('keeps records for different dates independent', () => {
    saveDayRecord('2026-05-19', { workStart: '08:00', workEnd: '16:00', pauseMinutes: 0 })
    saveDayRecord('2026-05-20', { workStart: '09:00', workEnd: '17:00', pauseMinutes: 30 })
    expect(getDayRecord('2026-05-19')?.workStart).toBe('08:00')
    expect(getDayRecord('2026-05-20')?.workStart).toBe('09:00')
  })
})
