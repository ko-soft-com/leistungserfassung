import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useGlobalShortcuts } from '../useGlobalShortcuts'

describe('useGlobalShortcuts', () => {
  it('calls onFocusNew when N is pressed outside an input', () => {
    const onFocusNew = vi.fn()
    renderHook(() => useGlobalShortcuts({ onFocusNew, onFocusSearch: vi.fn(), onToggleHelp: vi.fn() }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    expect(onFocusNew).toHaveBeenCalledOnce()
  })

  it('does not call onFocusNew when N is pressed inside an input', () => {
    const onFocusNew = vi.fn()
    renderHook(() => useGlobalShortcuts({ onFocusNew, onFocusSearch: vi.fn(), onToggleHelp: vi.fn() }))
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    expect(onFocusNew).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('calls onFocusSearch on Cmd+K', () => {
    const onFocusSearch = vi.fn()
    renderHook(() => useGlobalShortcuts({ onFocusNew: vi.fn(), onFocusSearch, onToggleHelp: vi.fn() }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    expect(onFocusSearch).toHaveBeenCalledOnce()
  })

  it('calls onFocusSearch on Ctrl+K', () => {
    const onFocusSearch = vi.fn()
    renderHook(() => useGlobalShortcuts({ onFocusNew: vi.fn(), onFocusSearch, onToggleHelp: vi.fn() }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
    expect(onFocusSearch).toHaveBeenCalledOnce()
  })

  it('calls onToggleHelp when ? is pressed', () => {
    const onToggleHelp = vi.fn()
    renderHook(() => useGlobalShortcuts({ onFocusNew: vi.fn(), onFocusSearch: vi.fn(), onToggleHelp }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    expect(onToggleHelp).toHaveBeenCalledOnce()
  })

  it('cleans up listener on unmount', () => {
    const onFocusNew = vi.fn()
    const { unmount } = renderHook(() => useGlobalShortcuts({ onFocusNew, onFocusSearch: vi.fn(), onToggleHelp: vi.fn() }))
    unmount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    expect(onFocusNew).not.toHaveBeenCalled()
  })
})
