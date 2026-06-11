import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JiraRow from '../JiraRow'
import type { JiraTicket } from '../../../types/jiraTicket'
import type { TimeEntry } from '../../../types/entry'

const ticket: JiraTicket = {
  id: 't-1',
  nummer: 'AP-123',
  titel: 'Login fix',
  issueType: 'Story',
  status: 'In Progress',
  beschreibung: 'Benutzer können sich nicht einloggen wenn SSO aktiv ist.',
  kommentar: 'Dringend',
  faelligkeitsdatum: null,
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
}

const matchingEntry: TimeEntry = {
  id: 'e-1', date: '2026-06-04', start: '09:00', end: '10:00',
  client: 'Kunde A', orderNo: 'AU-01', account: 'Dev',
  task: 'Bug-Fixing', description: 'AP-123 fix',
  jira: 'AP-123',
  createdAt: '2026-06-04T09:00:00.000Z', updatedAt: '2026-06-04T09:00:00.000Z',
}

const noMatchEntry: TimeEntry = { ...matchingEntry, id: 'e-2', jira: 'AP-999' }

describe('JiraRow', () => {
  it('renders ticket nummer, issueType, titel, status and kommentar', () => {
    render(<JiraRow ticket={ticket} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('AP-123')).toBeInTheDocument()
    expect(screen.getByText('Story')).toBeInTheDocument()
    expect(screen.getByText('Login fix')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Dringend')).toBeInTheDocument()
  })

  it('shows expand button', () => {
    render(<JiraRow ticket={ticket} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Buchungen anzeigen' })).toBeInTheDocument()
  })

  it('shows beschreibung when expanded', () => {
    render(<JiraRow ticket={ticket} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText('Benutzer können sich nicht einloggen wenn SSO aktiv ist.')).toBeInTheDocument()
  })

  it('does not show beschreibung section when beschreibung is empty', () => {
    const ticketNoBeschreibung = { ...ticket, beschreibung: '' }
    render(<JiraRow ticket={ticketNoBeschreibung} timeEntries={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.queryByText('Beschreibung')).not.toBeInTheDocument()
  })

  it('shows "Keine Buchungen gefunden" when expanded with no matching entries', () => {
    render(<JiraRow ticket={ticket} timeEntries={[noMatchEntry]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText('Keine Buchungen gefunden')).toBeInTheDocument()
  })

  it('shows matched time entries and total when expanded', () => {
    render(<JiraRow ticket={ticket} timeEntries={[matchingEntry]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buchungen anzeigen' }))
    expect(screen.getByText(/Gesamt:/)).toBeInTheDocument()
    expect(screen.getAllByText(/1:00h/)).toHaveLength(2)
  })

  it('calls onEdit with ticket when Bearbeiten is clicked', () => {
    const onEdit = vi.fn()
    render(<JiraRow ticket={ticket} timeEntries={[]} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
    expect(onEdit).toHaveBeenCalledWith(ticket)
  })

  it('calls onDelete with ticket id when Löschen is clicked', () => {
    const onDelete = vi.fn()
    render(<JiraRow ticket={ticket} timeEntries={[]} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onDelete).toHaveBeenCalledWith('t-1')
  })
})
