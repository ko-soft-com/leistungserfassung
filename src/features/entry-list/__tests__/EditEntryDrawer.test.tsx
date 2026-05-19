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
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={onClose} />)
    await user.click(screen.getByText('Abbrechen'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders the entry date', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.value).toBe('2026-05-12')
  })

  it('passes updated date to onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={onSave} onClose={() => {}} />)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2026-05-13' } })
    await user.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-05-13' }))
  })

  it('shows computed duration from start and end', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    const dauerInput = screen.getByLabelText('Dauer') as HTMLInputElement
    expect(dauerInput.value).toBe('1:30')
  })

  it('updating duration updates end when start is set', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={onSave} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Dauer'), { target: { value: '2:00' } })
    await user.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ end: '10:00' }))
  })

  it('updating start updates duration display', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '08:30' } })
    expect((screen.getByLabelText('Dauer') as HTMLInputElement).value).toBe('1:00')
  })

  it('updating end updates duration display', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Ende'), { target: { value: '10:00' } })
    expect((screen.getByLabelText('Dauer') as HTMLInputElement).value).toBe('2:00')
  })

  it('typing duration then setting start computes end for null/null entry', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const nullEntry: TimeEntry = { ...entry, start: null, end: null }
    render(<EditEntryDrawer entry={nullEntry} onSave={onSave} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Dauer'), { target: { value: '2:00' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '09:00' } })
    await user.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ end: '11:00' }))
  })

  it('typing duration then setting end computes start for null/null entry', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const nullEntry: TimeEntry = { ...entry, start: null, end: null }
    render(<EditEntryDrawer entry={nullEntry} onSave={onSave} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Dauer'), { target: { value: '1:30' } })
    fireEvent.change(screen.getByLabelText('Ende'), { target: { value: '11:00' } })
    await user.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ start: '09:30' }))
  })

  it('renders Epic, Story, Task radio buttons', () => {
    render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByLabelText('Epic')).toBeInTheDocument()
    expect(screen.getByLabelText('Story')).toBeInTheDocument()
    expect(screen.getByLabelText('Task')).toBeInTheDocument()
  })

  it('saves selected jiraIssueType when Speichern is clicked', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditEntryDrawer entry={entry} onSave={onSave} onClose={() => {}} />)
    fireEvent.click(screen.getByLabelText('Story'))
    await user.click(screen.getByText('Speichern'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ jiraIssueType: 'Story' }))
  })
})
