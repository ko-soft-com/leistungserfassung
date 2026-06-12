import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuickAddBar from '../QuickAddBar'

vi.mock('../QuickAddJiraModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="jira-modal"><button onClick={onClose}>schließen</button></div>
  ),
}))
vi.mock('../QuickAddPrModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pr-modal"><button onClick={onClose}>schließen</button></div>
  ),
}))
vi.mock('../QuickAddTaskModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="task-modal"><button onClick={onClose}>schließen</button></div>
  ),
}))
vi.mock('../QuickAddZeitModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="zeit-modal"><button onClick={onClose}>schließen</button></div>
  ),
}))

describe('QuickAddBar', () => {
  it('renders all four buttons', () => {
    render(<QuickAddBar />)
    expect(screen.getByText('Zeiterfassung')).toBeDefined()
    expect(screen.getByText('Jira-Ticket')).toBeDefined()
    expect(screen.getByText('Pull Request')).toBeDefined()
    expect(screen.getByText('Aufgabe')).toBeDefined()
  })

  it('opens Jira modal on button click', () => {
    render(<QuickAddBar />)
    fireEvent.click(screen.getByText('Jira-Ticket'))
    expect(screen.getByTestId('jira-modal')).toBeDefined()
  })

  it('opens PR modal on button click', () => {
    render(<QuickAddBar />)
    fireEvent.click(screen.getByText('Pull Request'))
    expect(screen.getByTestId('pr-modal')).toBeDefined()
  })

  it('opens Task modal on button click', () => {
    render(<QuickAddBar />)
    fireEvent.click(screen.getByText('Aufgabe'))
    expect(screen.getByTestId('task-modal')).toBeDefined()
  })

  it('opens Zeit modal on button click', () => {
    render(<QuickAddBar />)
    fireEvent.click(screen.getByText('Zeiterfassung'))
    expect(screen.getByTestId('zeit-modal')).toBeDefined()
  })

  it('closes modal when onClose is called', () => {
    render(<QuickAddBar />)
    fireEvent.click(screen.getByText('Jira-Ticket'))
    fireEvent.click(screen.getByText('schließen'))
    expect(screen.queryByTestId('jira-modal')).toBeNull()
  })
})
