import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

describe('tokens.css', () => {
  const css = readFileSync(resolve(__dirname, '../tokens.css'), 'utf-8')

  it('defines --bg as stone-50', () => {
    expect(css).toContain('--bg:')
    expect(css).toContain('#fafaf9')
  })

  it('defines --accent as green-600', () => {
    expect(css).toContain('--accent:')
    expect(css).toContain('#16a34a')
  })

  it('defines all four task-pill color pairs', () => {
    expect(css).toContain('--task-bug-bg')
    expect(css).toContain('--task-feat-bg')
    expect(css).toContain('--task-rev-bg')
    expect(css).toContain('--task-meet-bg')
  })
})
