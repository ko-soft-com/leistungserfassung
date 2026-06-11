import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Task } from '../../../types/task'

vi.mock('../../../services/firestoreTasks', () => ({
  getTasks: vi.fn(),
  saveTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

vi.mock('../../../services/firestoreJiraTickets', () => ({
  getJiraTickets: vi.fn(),
}))

vi.mock('../../../services/firestorePullRequests', () => ({
  getPullRequests: vi.fn(),
}))

import { getTasks, saveTask, deleteTask, updateTask } from '../../../services/firestoreTasks'
import { getJiraTickets } from '../../../services/firestoreJiraTickets'
import { getPullRequests } from '../../../services/firestorePullRequests'
import TasksPage from '../TasksPage'

const task: Task = {
  id: 'task-1',
  titel: 'Login implementieren',
  beschreibung: '',
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getTasks).mockResolvedValue([task])
  vi.mocked(getJiraTickets).mockResolvedValue([])
  vi.mocked(getPullRequests).mockResolvedValue([])
})

describe('TasksPage', () => {
  it('renders the page heading', async () => {
    render(<TasksPage />)
    expect(screen.getByText('Aufgaben')).toBeInTheDocument()
  })

  it('shows loaded tasks', async () => {
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByText('Login implementieren')).toBeInTheDocument())
  })

  it('shows loading indicator while fetching', () => {
    vi.mocked(getTasks).mockReturnValue(new Promise(() => {}))
    render(<TasksPage />)
    expect(screen.getByText('Laden…')).toBeInTheDocument()
  })

  it('shows error message when loading fails', async () => {
    vi.mocked(getTasks).mockRejectedValue(new Error('network'))
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows validation error when submitting without titel', async () => {
    vi.mocked(getTasks).mockResolvedValue([])
    render(<TasksPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Titel ist erforderlich')).toBeInTheDocument()
  })

  it('saves a new task and shows it in the list', async () => {
    vi.mocked(getTasks).mockResolvedValue([])
    const newTask: Task = { ...task, id: 'new-id', titel: 'Neue Aufgabe' }
    vi.mocked(saveTask).mockResolvedValue(newTask)
    render(<TasksPage />)
    await waitFor(() => expect(screen.queryByText('Laden…')).not.toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Titel'), { target: { value: 'Neue Aufgabe' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(screen.getByText('Neue Aufgabe')).toBeInTheDocument())
  })

  it('removes task from list when Löschen is clicked', async () => {
    vi.mocked(deleteTask).mockResolvedValue(undefined)
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByText('Login implementieren')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    await waitFor(() => expect(screen.queryByText('Login implementieren')).not.toBeInTheDocument())
  })

  it('enters edit mode when Bearbeiten is clicked', async () => {
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByText('Login implementieren')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
    expect(screen.getByText('Bearbeitungsmodus')).toBeInTheDocument()
    expect(screen.getByLabelText('Titel')).toHaveValue('Login implementieren')
  })

  it('quick-starts a task and updates its status in the list', async () => {
    vi.mocked(updateTask).mockResolvedValue(undefined)
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Starten' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Starten' }))
    await waitFor(() => expect(screen.getByText('In Arbeit')).toBeInTheDocument())
  })

  it('quick-stops a running task and updates its status to Fertig', async () => {
    const runningTask: Task = {
      ...task,
      status: 'In Arbeit',
      startedAt: '2026-06-11T08:00:00.000Z',
    }
    vi.mocked(getTasks).mockResolvedValue([runningTask])
    vi.mocked(updateTask).mockResolvedValue(undefined)
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stoppen' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Stoppen' }))
    await waitFor(() => expect(screen.getByText('Fertig')).toBeInTheDocument())
  })
})
