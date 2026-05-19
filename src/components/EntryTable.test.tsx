import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryTable from './EntryTable'
import type { Eintrag } from '../types/entry'

const mockEntry: Eintrag = {
  id: 'e1',
  auftraggeber: 'Kunde A',
  auftragsnummer: 'AU-001',
  auftrag: 'Website',
  zeitkonto: 'ZK-01',
  aufgabe: 'Frontend',
  datum: '2026-05-11',
  dauer: { stunden: 2, minuten: 30 },
  createdAt: 1715000000000,
}

describe('EntryTable', () => {
  it('shows empty state message when no entries', () => {
    render(<EntryTable eintraege={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/Noch keine Einträge/i)).toBeInTheDocument()
  })

  it('renders entry data in table', () => {
    render(<EntryTable eintraege={[mockEntry]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Kunde A')).toBeInTheDocument()
    expect(screen.getByText('AU-001')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
    expect(screen.getByText('11.05.2026')).toBeInTheDocument()
  })

  it('calls onEdit with entry id when Bearbeiten clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<EntryTable eintraege={[mockEntry]} onEdit={onEdit} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Bearbeiten/i }))
    expect(onEdit).toHaveBeenCalledWith('e1')
  })

  it('calls onDelete with entry id when Löschen clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<EntryTable eintraege={[mockEntry]} onEdit={vi.fn()} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /Löschen/i }))
    expect(onDelete).toHaveBeenCalledWith('e1')
  })
})
