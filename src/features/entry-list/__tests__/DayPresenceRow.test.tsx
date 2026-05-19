import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import DayPresenceRow from '../DayPresenceRow'

describe('DayPresenceRow', () => {
  afterEach(() => localStorage.clear())

  it('renders von/bis/Pause inputs for the date', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={0} />)
    expect(screen.getByLabelText('von')).toBeInTheDocument()
    expect(screen.getByLabelText('bis')).toBeInTheDocument()
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('shows no bar and no "gebucht" text when workStart or workEnd is empty', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={90} />)
    expect(screen.queryByText(/gebucht/)).not.toBeInTheDocument()
  })

  it('shows actual time and bar when both times are entered', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={90} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText('2:00h akt.')).toBeInTheDocument()
    expect(screen.getByText(/gebucht/)).toBeInTheDocument()
  })

  it('applies pause reduction to actual minutes', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Pause'), { target: { value: '30' } })
    expect(screen.getByText('1:30h akt.')).toBeInTheDocument()
  })

  it('shows "X:XXh offen" when booked < actual', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={60} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText(/1:00h offen/)).toBeInTheDocument()
  })

  it('does not show "offen" when booked >= actual', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={120} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.queryByText(/offen/)).not.toBeInTheDocument()
  })

  it('persists record to localStorage on change', () => {
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '09:00' } })
    const stored = JSON.parse(localStorage.getItem('day-records') ?? '{}')
    expect(stored['2026-05-19']?.workStart).toBe('09:00')
  })

  it('loads existing record from localStorage on mount', () => {
    localStorage.setItem('day-records', JSON.stringify({
      '2026-05-19': { date: '2026-05-19', workStart: '07:30', workEnd: '16:00', pauseMinutes: 45 },
    }))
    render(<DayPresenceRow date="2026-05-19" bookedMinutes={0} />)
    expect((screen.getByLabelText('von') as HTMLInputElement).value).toBe('07:30')
    expect((screen.getByLabelText('bis') as HTMLInputElement).value).toBe('16:00')
    expect((screen.getByLabelText('Pause') as HTMLInputElement).value).toBe('45')
  })
})
