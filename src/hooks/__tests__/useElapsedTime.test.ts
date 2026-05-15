import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useElapsedTime } from '../useElapsedTime'

describe('useElapsedTime', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 00:00:00 when startedAt is null', () => {
    const { result } = renderHook(() => useElapsedTime(null))
    expect(result.current).toBe('00:00:00')
  })

  it('shows elapsed time after 61 seconds', () => {
    const startedAt = Date.now()
    const { result } = renderHook(() => useElapsedTime(startedAt))
    act(() => vi.advanceTimersByTime(61_000))
    expect(result.current).toBe('00:01:01')
  })

  it('shows hours and minutes correctly', () => {
    const startedAt = Date.now()
    const { result } = renderHook(() => useElapsedTime(startedAt))
    act(() => vi.advanceTimersByTime(3_661_000))
    expect(result.current).toBe('01:01:01')
  })

  it('resets to 00:00:00 when startedAt becomes null', () => {
    const startedAt = Date.now()
    const { result, rerender } = renderHook(({ t }) => useElapsedTime(t), { initialProps: { t: startedAt as number | null } })
    act(() => vi.advanceTimersByTime(5_000))
    rerender({ t: null })
    expect(result.current).toBe('00:00:00')
  })
})
