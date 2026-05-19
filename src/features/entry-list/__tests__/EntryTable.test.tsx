import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EntryTable from '../EntryTable'
import type { TimeEntry } from '../../../types/entry'

const makeEntry = (id: string, date: string): TimeEntry => ({
  id,
  date,
  start: '09:00',
  end: '10:00',
  client: 'WASCOSA',
  orderNo: 'SP 01',
  account: 'Dev',
  task: 'Feature',
  description: 'Test entry',
  createdAt: '',
  updatedAt: '',
})

describe('EntryTable', () => {
  it('renders empty state when no entries', () => {
    render(<EntryTable entries={[]} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Noch keine Zeiten erfasst')).toBeInTheDocument()
  })

  it('renders entries grouped by date, most recent first', () => {
    const entries = [
      makeEntry('1', '2026-05-10'),
      makeEntry('2', '2026-05-12'),
      makeEntry('3', '2026-05-11'),
    ]
    render(<EntryTable entries={entries} onEdit={() => {}} onDelete={() => {}} />)
    // DayGroupHeader buttons contain the formatted date; filter by date pattern to exclude EntryRow buttons
    const headers = screen.getAllByRole('button', { name: /\d\d\.\d\d\.\d{4}/ })
    // Most recent date group header should appear first
    expect(headers[0]).toHaveTextContent('12.05.2026')
    expect(headers[1]).toHaveTextContent('11.05.2026')
    expect(headers[2]).toHaveTextContent('10.05.2026')
  })

  it('calls onDuplicate when the Duplizieren button is clicked', () => {
    const onDuplicate = vi.fn()
    render(
      <EntryTable
        entries={[makeEntry('1', '2026-05-10')]}
        onEdit={() => {}}
        onDelete={() => {}}
        onDuplicate={onDuplicate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplicate).toHaveBeenCalledWith('1')
  })

  it('renders DayPresenceRow inputs for each date group', () => {
    render(
      <EntryTable
        entries={[makeEntry('1', '2026-05-10')]}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByLabelText('von')).toBeInTheDocument()
    expect(screen.getByLabelText('bis')).toBeInTheDocument()
  })
})
