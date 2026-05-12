import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useTimerStore } from '../timer'

describe('useTimerStore', () => {
  beforeEach(() => useTimerStore.setState({ activeTimer: null }))

  it('starts timer with draft', () => {
    const { result } = renderHook(() => useTimerStore())
    act(() => result.current.startTimer({ client: 'WASCOSA', orderNo: 'SP 01', account: 'Dev' }))
    expect(result.current.activeTimer).not.toBeNull()
    expect(result.current.activeTimer?.startedAt).toBeGreaterThan(0)
  })

  it('stops timer and clears', () => {
    const { result } = renderHook(() => useTimerStore())
    act(() => result.current.startTimer({ client: 'WASCOSA', orderNo: 'SP 01', account: 'Dev' }))
    act(() => result.current.stopTimer())
    expect(result.current.activeTimer).toBeNull()
  })
})
