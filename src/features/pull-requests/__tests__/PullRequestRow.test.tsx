import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PullRequestRow from '../PullRequestRow'
import type { PullRequest } from '../../../types/pullRequest'
import type { TimeEntry } from '../../../types/entry'

const pr: PullRequest = {
  id: 'pr-1',
  nummer: '42',
  titel: 'fix: SSO redirect',
  status: 'Open',
  reviewer: 'alice',
  kommentar: 'Wartet auf Review',
  history: [],
  faelligkeitsdatum: null,
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
}

const matchingEntry: TimeEntry = {
  id: 'e-1', date: '2026-06-04', start: '09:00', end: '11:00',
  client: 'Kunde A', orderNo: 'AU-01', account: 'Dev',
  task: 'Review', description: 'Review SSO',
  pr: '42',
  createdAt: '2026-06-04T09:00:00.000Z', updatedAt: '2026-06-04T09:00:00.000Z',
}

const noMatchEntry: TimeEntry = { ...matchingEntry, id: 'e-2', pr: '99' }

describe('PullRequestRow', () => {
  it('renders PR nummer, titel, reviewer, status and kommentar', () => {
    render(<PullRequestRow pr={pr} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('fix: SSO redirect')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Wartet auf Review')).toBeInTheDocument()
  })

  it('renders Review in Progress status pill', () => {
    const prRip = { ...pr, status: 'Review in Progress' as const }
    render(<PullRequestRow pr={prRip} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Review in Progress')).toBeInTheDocument()
  })

  it('shows "Keine Buchungen gefunden" when expanded with no matching entries', () => {
    render(<PullRequestRow pr={pr} timeEntries={[noMatchEntry]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText('Keine Buchungen gefunden')).toBeInTheDocument()
  })

  it('shows matched time entries and total when expanded', () => {
    render(<PullRequestRow pr={pr} timeEntries={[matchingEntry]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText(/Gesamt:/)).toBeInTheDocument()
    expect(screen.getAllByText(/2:00h/)).toHaveLength(2)
  })

  it('shows empty history message when history is empty', () => {
    render(<PullRequestRow pr={pr} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText('Noch keine Statusänderungen')).toBeInTheDocument()
  })

  it('shows history entries when present', () => {
    const prWithHistory: PullRequest = {
      ...pr,
      history: [{ timestamp: '2026-06-05T14:32:00.000Z', von: 'Draft', nach: 'Open' }],
    }
    render(<PullRequestRow pr={prWithHistory} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText(/Draft → Open/)).toBeInTheDocument()
  })

  it('calls onEdit with pr when Bearbeiten is clicked', () => {
    const onEdit = vi.fn()
    render(<PullRequestRow pr={pr} timeEntries={[]} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
    expect(onEdit).toHaveBeenCalledWith(pr)
  })

  it('calls onDelete with pr id when Löschen is clicked', () => {
    const onDelete = vi.fn()
    render(<PullRequestRow pr={pr} timeEntries={[]} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onDelete).toHaveBeenCalledWith('pr-1')
  })
})
