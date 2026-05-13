import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useDraft } from '../useDraft'

describe('useDraft', () => {
  it('initializes with empty client field', () => {
    const { result } = renderHook(() => useDraft())
    expect(result.current.draft.client).toBe('')
  })

  it('task defaults to empty string', () => {
    const { result } = renderHook(() => useDraft())
    expect(result.current.draft.task).toBe('')
  })

  it('validate: missing client returns error', () => {
    const { result } = renderHook(() => useDraft())
    act(() => { result.current.validate() })
    expect(result.current.errors.client).toBeTruthy()
  })

  it('validate: all required fields filled returns no errors', () => {
    const { result } = renderHook(() => useDraft())
    act(() => {
      result.current.setField('client', 'WASCOSA')
      result.current.setField('orderNo', 'SP 01')
      result.current.setField('account', 'Dev')
      result.current.setField('description', 'Testing something')
    })
    act(() => { result.current.validate() })
    expect(result.current.errors.client).toBeFalsy()
    expect(result.current.errors.orderNo).toBeFalsy()
    expect(result.current.errors.description).toBeFalsy()
  })

  it('validate: empty start does not produce an error', () => {
    const { result } = renderHook(() => useDraft())
    act(() => {
      result.current.setField('client', 'WASCOSA')
      result.current.setField('orderNo', 'SP 01')
      result.current.setField('account', 'Dev')
      result.current.setField('description', 'Testing something')
      result.current.setField('start', '')
    })
    act(() => { result.current.validate() })
    expect(result.current.errors.start).toBeFalsy()
  })

  it('reset clears draft and errors', () => {
    const { result } = renderHook(() => useDraft())
    act(() => {
      result.current.setField('client', 'TEST')
      result.current.validate()
    })
    act(() => { result.current.reset() })
    expect(result.current.draft.client).toBe('')
    expect(result.current.errors.client).toBeFalsy()
  })
})
