import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddTaskModal from '../QuickAddTaskModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockIncrement, mockToast, mockGetJira, mockGetPrs } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
  mockGetJira:   vi.fn().mockResolvedValue([]),
  mockGetPrs:    vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../services/firestoreTasks', () => ({ saveTask: mockSave }))
vi.mock('../../../services/firestoreJiraTickets', () => ({ getJiraTickets: mockGetJira }))
vi.mock('../../../services/firestorePullRequests', () => ({ getPullRequests: mockGetPrs }))
vi.mock('../../../stores/refresh', () => ({
  useRefreshStore: (sel: (s: { incrementTask: () => void }) => unknown) =>
    sel({ incrementTask: mockIncrement }),
}))
vi.mock('../../../stores/toast', () => ({
  useToastStore: (sel: (s: { addToast: () => void }) => unknown) =>
    sel({ addToast: mockToast }),
}))

describe('QuickAddTaskModal', () => {
  it('renders titel field', () => {
    render(<QuickAddTaskModal onClose={vi.fn()} />)
    expect(screen.getByLabelText('Titel *')).toBeDefined()
  })

  it('shows validation error when titel is empty', () => {
    render(<QuickAddTaskModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Speichern'))
    expect(screen.getByText('Titel ist erforderlich')).toBeDefined()
  })

  it('calls saveTask and incrementTask on valid submit', async () => {
    mockSave.mockResolvedValueOnce({})
    render(<QuickAddTaskModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Titel *'), { target: { value: 'Meine Aufgabe' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ titel: 'Meine Aufgabe' }))
      expect(mockIncrement).toHaveBeenCalled()
      expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
    })
  })

  it('shows error toast when save fails', async () => {
    mockSave.mockRejectedValueOnce(new Error('fail'))
    render(<QuickAddTaskModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Titel *'), { target: { value: 'T' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('error', expect.any(String))
      const btn = screen.getByText('Speichern').closest('button')
      expect(btn?.disabled).toBe(false)
    })
  })

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn()
    const { container } = render(<QuickAddTaskModal onClose={onClose} />)
    fireEvent(container.querySelector('dialog')!, new Event('close'))
    expect(onClose).toHaveBeenCalled()
  })
})
