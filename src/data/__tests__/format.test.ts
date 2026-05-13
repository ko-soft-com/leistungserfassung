import { describe, it, expect } from 'vitest'
import { fmtH, fmtDateDE, durationMinutes } from '../format'

describe('format', () => {
  it('fmtH formats minutes as H:MMh', () => {
    expect(fmtH(90)).toBe('1:30h')
    expect(fmtH(60)).toBe('1:00h')
    expect(fmtH(5)).toBe('0:05h')
  })

  it('fmtDateDE formats as DD.MM.YYYY', () => {
    expect(fmtDateDE('2026-05-12')).toBe('12.05.2026')
  })

  it('durationMinutes computes diff for completed entry', () => {
    const mins = durationMinutes({ date: '2026-05-12', start: '08:00', end: '09:30' } as any)
    expect(mins).toBe(90)
  })

  it('durationMinutes returns positive for running timer', () => {
    const mins = durationMinutes({ date: '2026-05-12', start: '00:00', end: null } as any)
    expect(mins).toBeGreaterThan(0)
  })

  it('durationMinutes returns 0 when start is null', () => {
    const mins = durationMinutes({ date: '2026-05-12', start: null, end: null } as any)
    expect(mins).toBe(0)
  })

  it('durationMinutes returns 0 when start is null even if end is set', () => {
    const mins = durationMinutes({ date: '2026-05-12', start: null, end: '10:30' } as any)
    expect(mins).toBe(0)
  })
})
