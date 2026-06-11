import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskRow from '../TaskRow'
import type { Task } from '../../../types/task'
import type { JiraTicket } from '../../../types/jiraTicket'
import type { PullRequest } from '../../../types/pullRequest'

const task: Task = {
  id: 'task-1',
  titel: 'Login implementieren',
  beschreibung: 'OAuth2 flow einrichten',
  status: 'Geplant',
  startedAt: null,
  endedAt: null,
  jiraTicketId: null,
  pullRequestId: null,
  history: [],
  faelligkeitsdatum: null,
  createdAt: '2026-06-11T08:00:00.000Z',
  updatedAt: '2026-06-11T08:00:00.000Z',
}

const defaultProps = {
  jiraTickets: [] as JiraTicket[],
  pullRequests: [] as PullRequest[],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onQuickStart: vi.fn(),
  onQuickStop: vi.fn(),
}

describe('TaskRow', () => {
  it('renders titel and status pill', () => {
    render(<TaskRow task={task} {...defaultProps} />)
    expect(screen.getByText('Login implementieren')).toBeInTheDocument()
    expect(screen.getByText('Geplant')).toBeInTheDocument()
  })

  it('shows play button when startedAt is null', () => {
    render(<TaskRow task={task} {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Starten' })).toBeInTheDocument()
  })

  it('shows stop button when startedAt is set but endedAt is null', () => {
    const running = { ...task, startedAt: '2026-06-11T08:00:00.000Z', status: 'In Arbeit' as const }
    render(<TaskRow task={running} {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Stoppen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Starten' })).not.toBeInTheDocument()
  })

  it('shows no timer button when both startedAt and endedAt are set', () => {
    const done = { ...task, startedAt: '2026-06-11T08:00:00.000Z', endedAt: '2026-06-11T09:00:00.000Z', status: 'Fertig' as const }
    render(<TaskRow task={done} {...defaultProps} />)
    expect(screen.queryByRole('button', { name: 'Starten' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stoppen' })).not.toBeInTheDocument()
  })

  it('calls onQuickStart with task id when play button is clicked', () => {
    const onQuickStart = vi.fn()
    render(<TaskRow task={task} {...defaultProps} onQuickStart={onQuickStart} />)
    fireEvent.click(screen.getByRole('button', { name: 'Starten' }))
    expect(onQuickStart).toHaveBeenCalledWith('task-1')
  })

  it('calls onQuickStop with task id when stop button is clicked', () => {
    const onQuickStop = vi.fn()
    const running = { ...task, startedAt: '2026-06-11T08:00:00.000Z', status: 'In Arbeit' as const }
    render(<TaskRow task={running} {...defaultProps} onQuickStop={onQuickStop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }))
    expect(onQuickStop).toHaveBeenCalledWith('task-1')
  })

  it('shows "Noch keine Statusänderungen" when history is empty and panel is expanded', () => {
    render(<TaskRow task={task} {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verlauf anzeigen' }))
    expect(screen.getByText('Noch keine Statusänderungen')).toBeInTheDocument()
  })

  it('shows history entries when panel is expanded', () => {
    const taskWithHistory: Task = {
      ...task,
      history: [{ timestamp: '2026-06-11T09:00:00.000Z', von: 'Geplant', nach: 'In Arbeit' }],
    }
    render(<TaskRow task={taskWithHistory} {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verlauf anzeigen' }))
    expect(screen.getByText(/Geplant → In Arbeit/)).toBeInTheDocument()
  })

  it('shows jira ticket nummer pill when linked', () => {
    const jira: JiraTicket = {
      id: 'j-1', nummer: 'AP-123', titel: 'Login fix', issueType: 'Task',
      status: 'In Progress', beschreibung: '', kommentar: '',
      faelligkeitsdatum: null,
      createdAt: '', updatedAt: '',
    }
    const taskWithJira = { ...task, jiraTicketId: 'j-1' }
    render(<TaskRow task={taskWithJira} {...defaultProps} jiraTickets={[jira]} />)
    expect(screen.getByText('AP-123')).toBeInTheDocument()
  })

  it('shows pr nummer pill when linked', () => {
    const pr: PullRequest = {
      id: 'pr-1', nummer: '42', titel: 'fix: SSO', status: 'Open',
      reviewer: '', kommentar: '', history: [], faelligkeitsdatum: null, createdAt: '', updatedAt: '',
    }
    const taskWithPr = { ...task, pullRequestId: 'pr-1' }
    render(<TaskRow task={taskWithPr} {...defaultProps} pullRequests={[pr]} />)
    expect(screen.getByText('#42')).toBeInTheDocument()
  })

  it('calls onEdit with task when Bearbeiten is clicked', () => {
    const onEdit = vi.fn()
    render(<TaskRow task={task} {...defaultProps} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
    expect(onEdit).toHaveBeenCalledWith(task)
  })

  it('calls onDelete with task id when Löschen is clicked', () => {
    const onDelete = vi.fn()
    render(<TaskRow task={task} {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })
})
