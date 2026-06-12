import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddJiraModal from '../QuickAddJiraModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockIncrement, mockToast } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
}))

vi.mock('../../../services/firestoreJiraTickets', () => ({ saveJiraTicket: mockSave }))
vi.mock('../../../stores/refresh', () => ({
  useRefreshStore: (sel: (s: { incrementJira: () => void }) => unknown) =>
    sel({ incrementJira: mockIncrement }),
}))
vi.mock('../../../stores/toast', () => ({
  useToastStore: (sel: (s: { addToast: () => void }) => unknown) =>
    sel({ addToast: mockToast }),
}))

describe('QuickAddJiraModal', () => {
  it('renders required fields', () => {
    render(<QuickAddJiraModal onClose={vi.fn()} />)
    expect(screen.getByLabelText('Nummer *')).toBeDefined()
    expect(screen.getByLabelText('Titel *')).toBeDefined()
  })

  it('shows validation errors when required fields are empty', () => {
    render(<QuickAddJiraModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Speichern'))
    expect(screen.getByText('Nummer ist erforderlich')).toBeDefined()
    expect(screen.getByText('Titel ist erforderlich')).toBeDefined()
  })

  it('calls saveJiraTicket and incrementJira on valid submit', async () => {
    mockSave.mockResolvedValueOnce({})
    render(<QuickAddJiraModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Nummer *'), { target: { value: 'AP-1' } })
    fireEvent.change(screen.getByLabelText('Titel *'),  { target: { value: 'Test Ticket' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ nummer: 'AP-1', titel: 'Test Ticket' }))
      expect(mockIncrement).toHaveBeenCalled()
    })
  })

  it('shows error toast when save fails', async () => {
    mockSave.mockRejectedValueOnce(new Error('fail'))
    render(<QuickAddJiraModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Nummer *'), { target: { value: 'AP-1' } })
    fireEvent.change(screen.getByLabelText('Titel *'),  { target: { value: 'Test' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('error', expect.any(String)))
  })

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn()
    const { container } = render(<QuickAddJiraModal onClose={onClose} />)
    fireEvent(container.querySelector('dialog')!, new Event('close'))
    expect(onClose).toHaveBeenCalled()
  })
})
