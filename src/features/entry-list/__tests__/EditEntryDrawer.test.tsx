import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import EditEntryDrawer from '../EditEntryDrawer'
import type { TimeEntry } from '../../../types/entry'

const entry: TimeEntry = {
  id: '1', date: '2026-05-12', start: '08:00', end: '09:30',
  client: 'WASCOSA', orderNo: 'SP 07', account: '#WX-225',
  task: 'Feature', description: 'Test desc', createdAt: '', updatedAt: '',
}

describe('EditEntryDrawer', () => {
  it('renders entry data when open', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByDisplayValue('WASCOSA')).toBeInTheDocument()
  })

  it('calls onClose when Abbrechen clicked', async () => {
    const onClose = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={onClose} />)
    await userEvent.click(screen.getByText('Abbrechen'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders the entry date', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.value).toBe('2026-05-12')
  })

  it('passes updated date to onSave', async () => {
    const onSave = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={onSave} onClose={() => {}} />)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-05-13' } })
    await userEvent.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-05-13' }))
  })
})
