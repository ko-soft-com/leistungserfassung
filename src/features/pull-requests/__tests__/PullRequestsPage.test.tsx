import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PullRequest } from '../../../types/pullRequest'

vi.mock('../../../services/firestorePullRequests', () => ({
  getPullRequests: vi.fn(),
  savePullRequest: vi.fn(),
  updatePullRequest: vi.fn(),
  deletePullRequest: vi.fn(),
}))

vi.mock('../../../services/firestoreTimeEntries', () => ({
  getTimeEntries: vi.fn(),
}))

import { getPullRequests, savePullRequest, deletePullRequest } from '../../../services/firestorePullRequests'
import { getTimeEntries } from '../../../services/firestoreTimeEntries'
import PullRequestsPage from '../PullRequestsPage'

const pr: PullRequest = {
  id: 'pr-1',
  name: 'fix: SSO redirect',
  status: 'Open',
  kommentar: 'Wartet auf Review',
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getPullRequests).mockResolvedValue([pr])
  vi.mocked(getTimeEntries).mockResolvedValue([])
})

describe('PullRequestsPage', () => {
  it('renders the page heading', async () => {
    render(<PullRequestsPage />)
    expect(screen.getByText('Pull Requests')).toBeInTheDocument()
  })

  it('shows loaded pull requests', async () => {
    render(<PullRequestsPage />)
    await waitFor(() => expect(screen.getByText('fix: SSO redirect')).toBeInTheDocument())
  })

  it('shows name error when submitting empty form', async () => {
    vi.mocked(getPullRequests).mockResolvedValue([])
    render(<PullRequestsPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Name ist erforderlich')).toBeInTheDocument()
  })

  it('saves a new PR and shows it in the list', async () => {
    vi.mocked(getPullRequests).mockResolvedValue([])
    const newPr: PullRequest = { ...pr, id: 'new-id', name: 'feat: new feature' }
    vi.mocked(savePullRequest).mockResolvedValue(newPr)
    render(<PullRequestsPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'feat: new feature' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(screen.getByText('feat: new feature')).toBeInTheDocument())
  })

  it('removes PR from list when Löschen is clicked', async () => {
    vi.mocked(deletePullRequest).mockResolvedValue(undefined)
    render(<PullRequestsPage />)
    await waitFor(() => expect(screen.getByText('fix: SSO redirect')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await waitFor(() => expect(screen.queryByText('fix: SSO redirect')).not.toBeInTheDocument())
  })
})
