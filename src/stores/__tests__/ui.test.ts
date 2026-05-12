import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ collapsedDays: [], drawerOpen: false, drawerEntryId: null })
  })

  it('toggles a day into collapsedDays', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleDay('2026-05-12'))
    expect(result.current.collapsedDays).toContain('2026-05-12')
  })

  it('toggles a day out of collapsedDays', () => {
    useUIStore.setState({ collapsedDays: ['2026-05-12'], drawerOpen: false, drawerEntryId: null })
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleDay('2026-05-12'))
    expect(result.current.collapsedDays).not.toContain('2026-05-12')
  })

  it('opens and closes drawer', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.openDrawer('entry-1'))
    expect(result.current.drawerOpen).toBe(true)
    expect(result.current.drawerEntryId).toBe('entry-1')
    act(() => result.current.closeDrawer())
    expect(result.current.drawerOpen).toBe(false)
    expect(result.current.drawerEntryId).toBeNull()
  })
})
