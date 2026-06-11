import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import DueDatePill from '../DueDatePill'

describe('DueDatePill', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-11T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when date is null', () => {
    const { container } = render(<DueDatePill date={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('formats date as DD.MM.YYYY', () => {
    render(<DueDatePill date="2026-06-11" />)
    expect(screen.getByText('11.06.2026')).toBeInTheDocument()
  })

  it('applies overdue class for yesterday', () => {
    const { container } = render(<DueDatePill date="2026-06-10" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/overdue/)
  })

  it('does not apply overdue class for tomorrow', () => {
    const { container } = render(<DueDatePill date="2026-06-12" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toMatch(/overdue/)
  })

  it('does not apply overdue class for today', () => {
    const { container } = render(<DueDatePill date="2026-06-11" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toMatch(/overdue/)
  })
})
