import { describe, it, expect, beforeEach } from 'vitest'
import { useRefreshStore } from '../refresh'

describe('useRefreshStore', () => {
  beforeEach(() => {
    useRefreshStore.setState({ jiraVersion: 0, prVersion: 0, taskVersion: 0, zeitVersion: 0 })
  })

  it('starts all versions at 0', () => {
    const s = useRefreshStore.getState()
    expect(s.jiraVersion).toBe(0)
    expect(s.prVersion).toBe(0)
    expect(s.taskVersion).toBe(0)
    expect(s.zeitVersion).toBe(0)
  })

  it('incrementJira increments jiraVersion', () => {
    useRefreshStore.getState().incrementJira()
    expect(useRefreshStore.getState().jiraVersion).toBe(1)
  })

  it('incrementPr increments prVersion', () => {
    useRefreshStore.getState().incrementPr()
    expect(useRefreshStore.getState().prVersion).toBe(1)
  })

  it('incrementTask increments taskVersion', () => {
    useRefreshStore.getState().incrementTask()
    expect(useRefreshStore.getState().taskVersion).toBe(1)
  })

  it('incrementZeit increments zeitVersion', () => {
    useRefreshStore.getState().incrementZeit()
    expect(useRefreshStore.getState().zeitVersion).toBe(1)
  })
})
