import { render, screen } from '@testing-library/react'
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
})
