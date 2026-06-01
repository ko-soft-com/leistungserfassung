import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DayPresenceRow from '../DayPresenceRow'

vi.mock('../../../services/firestoreDayRecords', () => ({
  saveDayRecord: vi.fn((date: string, data: any) => Promise.resolve({ date, ...data })),
}))

import { saveDayRecord } from '../../../services/firestoreDayRecords'

describe('DayPresenceRow', () => {
  it('renders a single segment row with von/bis inputs by default', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    expect(screen.getAllByLabelText('von')).toHaveLength(1)
    expect(screen.getAllByLabelText('bis')).toHaveLength(1)
  })

  it('shows no bar and no "gebucht" text when segment times are empty', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={90} />)
    expect(screen.queryByText(/gebucht/)).not.toBeInTheDocument()
  })

  it('shows actual time and bar when segment has start and end', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={90} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText('2:00h akt.')).toBeInTheDocument()
    expect(screen.getByText(/gebucht/)).toBeInTheDocument()
  })

  it('shows "offen" when booked < actual', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={60} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText(/1:00h offen/)).toBeInTheDocument()
  })

  it('does not show "offen" when booked >= actual', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={120} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.queryByText(/offen/)).not.toBeInTheDocument()
  })

  it('adds a second segment when "+ Segment" is clicked', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    expect(screen.getAllByLabelText('von')).toHaveLength(2)
    expect(screen.getAllByLabelText('bis')).toHaveLength(2)
  })

  it('pre-fills new segment start from previous segment end', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    expect(vonInputs[1].value).toBe('12:00')
  })

  it('shows pause field between two segments', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('auto-calculates pause from gap between segments', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs[1], { target: { value: '13:00' } })
    expect((screen.getByLabelText('Pause') as HTMLInputElement).value).toBe('60')
  })

  it('uses pauseOverride when set instead of auto-calculated gap', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs[1], { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Pause'), { target: { value: '30' } })
    // Span: 08:00-not-set to 13:00 — actual time should reflect override
    // Two segments: seg0 end=12:00, seg1 start=13:00, override=30
    // span = 13:00 - seg0.start (empty) → 0 until seg0.start is set
    const bisInputs = screen.getAllByLabelText('bis') as HTMLInputElement[]
    fireEvent.change(bisInputs[1], { target: { value: '17:00' } })
    const vonInputs2 = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs2[0], { target: { value: '08:00' } })
    // span = 17:00 - 08:00 = 9h; break override = 30min; actual = 8:30h
    expect(screen.getByText('8:30h akt.')).toBeInTheDocument()
  })

  it('removes a segment when × is clicked', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment hinzufügen/i }))
    expect(screen.getAllByLabelText('von')).toHaveLength(2)
    const removeButtons = screen.getAllByRole('button', { name: /entfernen/i })
    fireEvent.click(removeButtons[0])
    expect(screen.getAllByLabelText('von')).toHaveLength(1)
  })

  it('hides remove button when only one empty segment remains', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    expect(screen.queryByRole('button', { name: /entfernen/i })).not.toBeInTheDocument()
  })

  it('shows remove button when single segment has a value', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    expect(screen.getByRole('button', { name: /entfernen/i })).toBeInTheDocument()
  })

  it('persists segments to Firestore after debounce', async () => {
    vi.useFakeTimers()
    try {
      render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
      fireEvent.change(screen.getByLabelText('von'), { target: { value: '09:00' } })
      await vi.runAllTimersAsync()
      expect(vi.mocked(saveDayRecord)).toHaveBeenCalledWith(
        '2026-06-01',
        expect.objectContaining({ segments: expect.arrayContaining([expect.objectContaining({ start: '09:00' })]) })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders pre-loaded segments from initialRecord', () => {
    render(
      <DayPresenceRow
        date="2026-06-01"
        bookedMinutes={0}
        initialRecord={{
          date: '2026-06-01',
          segments: [
            { start: '07:30', end: '12:00' },
            { start: '13:00', end: '16:30' },
          ],
        }}
      />
    )
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    const bisInputs = screen.getAllByLabelText('bis') as HTMLInputElement[]
    expect(vonInputs[0].value).toBe('07:30')
    expect(bisInputs[0].value).toBe('12:00')
    expect(vonInputs[1].value).toBe('13:00')
    expect(bisInputs[1].value).toBe('16:30')
  })

  it('falls back to single empty segment when removing the last valued segment', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    // singleEmpty is now false so remove button appears
    fireEvent.click(screen.getByRole('button', { name: /entfernen/i }))
    // should still have exactly one von input (the fallback empty segment)
    expect(screen.getAllByLabelText('von')).toHaveLength(1)
    const vonInput = screen.getByLabelText('von') as HTMLInputElement
    expect(vonInput.value).toBe('')
  })

  it('computes actual minutes across multiple segments with pause override', () => {
    render(
      <DayPresenceRow
        date="2026-06-01"
        bookedMinutes={0}
        initialRecord={{
          date: '2026-06-01',
          segments: [
            { start: '08:00', end: '12:00' },
            { start: '13:00', end: '17:00', pauseOverride: 45 },
          ],
        }}
      />
    )
    // span = 17:00 - 08:00 = 9h; break override = 45min; actual = 8:15h
    expect(screen.getByText('8:15h akt.')).toBeInTheDocument()
  })
})
