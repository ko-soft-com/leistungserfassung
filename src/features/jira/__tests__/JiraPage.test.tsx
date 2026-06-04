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
  name: 'AP-123 Login fix',
  status: 'Offen',
  kommentar: 'Prio 1',
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
    await waitFor(() => expect(screen.getByText('AP-123 Login fix')).toBeInTheDocument())
  })

  it('shows name error when submitting empty form', async () => {
    vi.mocked(getJiraTickets).mockResolvedValue([])
    render(<JiraPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Name ist erforderlich')).toBeInTheDocument()
  })

  it('saves a new ticket and shows it in the list', async () => {
    vi.mocked(getJiraTickets).mockResolvedValue([])
    const newTicket: JiraTicket = { ...ticket, id: 'new-id', name: 'AP-456 New' }
    vi.mocked(saveJiraTicket).mockResolvedValue(newTicket)
    render(<JiraPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'AP-456 New' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(screen.getByText('AP-456 New')).toBeInTheDocument())
  })

  it('removes ticket from list when Löschen is clicked', async () => {
    vi.mocked(deleteJiraTicket).mockResolvedValue(undefined)
    render(<JiraPage />)
    await waitFor(() => expect(screen.getByText('AP-123 Login fix')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await waitFor(() => expect(screen.queryByText('AP-123 Login fix')).not.toBeInTheDocument())
  })
})
