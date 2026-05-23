import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DayPresenceRow from '../DayPresenceRow'

vi.mock('../../../services/firestoreDayRecords', () => ({
  saveDayRecord: vi.fn((date: string, data: any) => Promise.resolve({ date, ...data })),
}))

import { saveDayRecord } from '../../../services/firestoreDayRecords'

describe('DayPresenceRow', () => {

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

  it('persists record to Firestore after debounce', async () => {
    vi.useFakeTimers()
    try {
      render(<DayPresenceRow date="2026-05-19" bookedMinutes={0} />)
      fireEvent.change(screen.getByLabelText('von'), { target: { value: '09:00' } })
      await vi.runAllTimersAsync()
      expect(vi.mocked(saveDayRecord)).toHaveBeenCalledWith(
        '2026-05-19',
        expect.objectContaining({ workStart: '09:00' })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders pre-loaded record from initialRecord prop', () => {
    render(
      <DayPresenceRow
        date="2026-05-19"
        bookedMinutes={0}
        initialRecord={{ date: '2026-05-19', workStart: '07:30', workEnd: '16:00', pauseMinutes: 45 }}
      />
    )
    expect((screen.getByLabelText('von') as HTMLInputElement).value).toBe('07:30')
    expect((screen.getByLabelText('bis') as HTMLInputElement).value).toBe('16:00')
    expect((screen.getByLabelText('Pause') as HTMLInputElement).value).toBe('45')
  })
})
