import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { JiraTicket } from '../../../types/jiraTicket'

vi.mock('../../../services/firestoreJiraTickets', () => ({
  getJiraTickets: vi.fn(),
  saveJiraTicket: vi.fn(),
  updateJiraTicket: vi.fn(),
  deleteJiraTicket: vi.fn(),
}))

vi.mock('../../../services/firestoreTimeEntries', () => ({
  getTimeEntries: vi.fn(),
}))

import { getJiraTickets, saveJiraTicket, deleteJiraTicket } from '../../../services/firestoreJiraTickets'
import { getTimeEntries } from '../../../services/firestoreTimeEntries'
import JiraPage from '../JiraPage'

const ticket: JiraTicket = {
  id: 't-1',
  nummer: 'AP-123',
  titel: 'Login fix',
  issueType: 'Story',
  status: 'Offen',
  beschreibung: '',
  kommentar: 'Prio 1',
  faelligkeitsdatum: null,
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getJiraTickets).mockResolvedValue([ticket])
  vi.mocked(getTimeEntries).mockResolvedValue([])
})

describe('JiraPage', () => {
  it('renders the page heading', async () => {
    render(<JiraPage />)
    expect(screen.getByText('Jira-Tickets')).toBeInTheDocument()
  })

  it('shows loaded tickets', async () => {
    render(<JiraPage />)
    await waitFor(() => expect(screen.getByText('AP-123')).toBeInTheDocument())
    expect(screen.getByText('Login fix')).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    vi.mocked(getJiraTickets).mockResolvedValue([])
    render(<JiraPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Nummer ist erforderlich')).toBeInTheDocument()
    expect(screen.getByText('Titel ist erforderlich')).toBeInTheDocument()
  })

  it('saves a new ticket with issueType and shows it in the list', async () => {
    vi.mocked(getJiraTickets).mockResolvedValue([])
    const newTicket: JiraTicket = { ...ticket, id: 'new-id', nummer: 'AP-456', titel: 'New Feature' }
    vi.mocked(saveJiraTicket).mockResolvedValue(newTicket)
    render(<JiraPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Nummer'), { target: { value: 'AP-456' } })
    fireEvent.change(screen.getByLabelText('Titel'), { target: { value: 'New Feature' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(screen.getByText('AP-456')).toBeInTheDocument())
  })

  it('removes ticket from list when Löschen is clicked', async () => {
    vi.mocked(deleteJiraTicket).mockResolvedValue(undefined)
    render(<JiraPage />)
    await waitFor(() => expect(screen.getByText('AP-123')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await waitFor(() => expect(screen.queryByText('AP-123')).not.toBeInTheDocument())
  })
})
