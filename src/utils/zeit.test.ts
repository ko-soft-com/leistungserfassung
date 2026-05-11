import { describe, it, expect } from 'vitest'
import { roundUpTo15, calcDauerFromZeit } from './zeit'

describe('roundUpTo15', () => {
  it('rounds 1 min up to 15', () => expect(roundUpTo15(1)).toBe(15))
  it('keeps exact 15-min multiples unchanged', () => expect(roundUpTo15(60)).toBe(60))
  it('rounds 61 up to 75', () => expect(roundUpTo15(61)).toBe(75))
  it('rounds 76 up to 90', () => expect(roundUpTo15(76)).toBe(90))
  it('rounds 14 up to 15', () => expect(roundUpTo15(14)).toBe(15))
  it('rounds 45 unchanged', () => expect(roundUpTo15(45)).toBe(45))
})

describe('calcDauerFromZeit', () => {
  it('calculates exactly 1h', () =>
    expect(calcDauerFromZeit('09:00', '10:00')).toEqual({ stunden: 1, minuten: 0 }))

  it('rounds 67 min (1h7m) up to 75 min (1h15m)', () =>
    expect(calcDauerFromZeit('09:00', '10:07')).toEqual({ stunden: 1, minuten: 15 }))

  it('rounds 16 min up to 30 min', () =>
    expect(calcDauerFromZeit('09:00', '09:16')).toEqual({ stunden: 0, minuten: 30 }))

  it('returns null when end equals start', () =>
    expect(calcDauerFromZeit('10:00', '10:00')).toBeNull())

  it('returns null when end is before start', () =>
    expect(calcDauerFromZeit('10:00', '09:00')).toBeNull())

  it('handles 2h30m exactly', () =>
    expect(calcDauerFromZeit('08:00', '10:30')).toEqual({ stunden: 2, minuten: 30 }))
})
