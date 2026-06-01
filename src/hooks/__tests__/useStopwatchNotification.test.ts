import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStopwatchNotification } from '../useStopwatchNotification'
import { useTimerStore } from '../../stores/timer'

const DRAFT = { client: 'Test', orderNo: '1', account: 'DEV' }
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

describe('useStopwatchNotification', () => {
  beforeEach(() => {
    useTimerStore.setState({ activeTimer: null })
    vi.stubGlobal('Notification', vi.fn())
  })

  it('fires notification when timer has run for over 2 hours', () => {
    const startedAt = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    renderHook(() => useStopwatchNotification())

    expect(Notification).toHaveBeenCalledOnce()
    expect(Notification).toHaveBeenCalledWith('Leistungserfassung', {
      body: 'Stoppuhr läuft seit 2 Stunden',
    })
  })

  it('does not fire notification before 2 hours', () => {
    const startedAt = Date.now() - 60 * 60 * 1000
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    renderHook(() => useStopwatchNotification())

    expect(Notification).not.toHaveBeenCalled()
  })

  it('does not fire when no timer is active', () => {
    renderHook(() => useStopwatchNotification())
    expect(Notification).not.toHaveBeenCalled()
  })

  it('fires only once per timer session even on multiple renders', () => {
    const startedAt = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt, draft: DRAFT } })

    const { rerender } = renderHook(() => useStopwatchNotification())
    rerender()
    rerender()

    expect(Notification).toHaveBeenCalledOnce()
  })

  it('resets notification when timer stops and restarts', () => {
    const startedAt1 = Date.now() - TWO_HOURS_MS - 1000
    useTimerStore.setState({ activeTimer: { startedAt: startedAt1, draft: DRAFT } })
    const { rerender } = renderHook(() => useStopwatchNotification())

    useTimerStore.setState({ activeTimer: null })
    rerender()

    const startedAt2 = Date.now() - TWO_HOURS_MS - 2000
    useTimerStore.setState({ activeTimer: { startedAt: startedAt2, draft: DRAFT } })
    rerender()

    expect(Notification).toHaveBeenCalledTimes(2)
  })
})
