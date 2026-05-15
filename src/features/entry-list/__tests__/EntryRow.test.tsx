import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EntryRow from '../EntryRow'
import type { TimeEntry } from '../../../types/entry'

// vi.hoisted ensures mockConfig is available when the hoisted vi.mock factory runs
const mockConfig = vi.hoisted(() => ({ JIRA_BASE_URL: '', PR_BASE_URL: '' }))
vi.mock('../../../config', () => mockConfig)

const baseEntry: TimeEntry = {
  id: '1', date: '2026-05-15', start: '09:00', end: '10:00',
  client: 'Kunde A', orderNo: 'AU-01', account: 'Dev',
  task: 'Feature', description: 'Test description',
  createdAt: '2026-05-15T09:00:00.000Z', updatedAt: '2026-05-15T09:00:00.000Z',
}

describe('EntryRow JIRA/PR links', () => {
  it('renders JIRA as link when JIRA_BASE_URL is configured', () => {
    mockConfig.JIRA_BASE_URL = 'https://jira.example.com/browse/'
    mockConfig.PR_BASE_URL = ''
    const entry = { ...baseEntry, jira: 'PROJ-99' }
    render(<EntryRow entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const link = screen.getByRole('link', { name: 'PROJ-99' })
    expect(link).toHaveAttribute('href', 'https://jira.example.com/browse/PROJ-99')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders JIRA as plain text when JIRA_BASE_URL is empty', () => {
    mockConfig.JIRA_BASE_URL = ''
    mockConfig.PR_BASE_URL = ''
    const entry = { ...baseEntry, jira: 'PROJ-99' }
    render(<EntryRow entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByRole('link', { name: 'PROJ-99' })).not.toBeInTheDocument()
    expect(screen.getByText('PROJ-99')).toBeInTheDocument()
  })

  it('renders PR as link when PR_BASE_URL is configured', () => {
    mockConfig.JIRA_BASE_URL = ''
    mockConfig.PR_BASE_URL = 'https://github.com/org/repo/pull/'
    const entry = { ...baseEntry, pr: '42' }
    render(<EntryRow entry={entry} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const link = screen.getByRole('link', { name: '#42' })
    expect(link).toHaveAttribute('href', 'https://github.com/org/repo/pull/42')
  })
})
