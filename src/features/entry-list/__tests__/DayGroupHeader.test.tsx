import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DayGroupHeader from '../DayGroupHeader'

describe('DayGroupHeader', () => {
  it('renders date label', () => {
    render(<DayGroupHeader date="2026-05-12" entryCount={3} totalMinutes={90} isCollapsed={false} onToggle={() => {}} />)
    expect(screen.getByText(/12.05.2026/)).toBeInTheDocument()
  })

  it('renders entry count', () => {
    render(<DayGroupHeader date="2026-05-12" entryCount={3} totalMinutes={90} isCollapsed={false} onToggle={() => {}} />)
    expect(screen.getByText(/3 Einträge/)).toBeInTheDocument()
  })

  it('renders day total', () => {
    render(<DayGroupHeader date="2026-05-12" entryCount={3} totalMinutes={90} isCollapsed={false} onToggle={() => {}} />)
    expect(screen.getByText('1:30h')).toBeInTheDocument()
  })

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn()
    render(<DayGroupHeader date="2026-05-12" entryCount={3} totalMinutes={90} isCollapsed={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
