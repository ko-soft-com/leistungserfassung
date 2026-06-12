import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddJiraModal from '../QuickAddJiraModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockGetJira, mockIncrement, mockToast } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockGetJira:   vi.fn().mockResolvedValue([]),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
}))

vi.mock('../../../services/firestoreJiraTickets', () => ({
  saveJiraTicket: mockSave,
  getJiraTickets: mockGetJira,
}))
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

  it('shows nummer and titel suggestions from existing tickets', async () => {
    mockGetJira.mockResolvedValueOnce([
      {
        id: '1', nummer: 'AP-123', titel: 'Login Feature',
        issueType: 'Task', status: 'Offen', beschreibung: '',
        kommentar: '', faelligkeitsdatum: null, createdAt: '', updatedAt: '',
      },
    ])
    render(<QuickAddJiraModal onClose={vi.fn()} />)
    await waitFor(() => {
      const nummerOpts = document.querySelectorAll('#qa-jira-nummer-list option')
      expect(Array.from(nummerOpts).some(o => o.getAttribute('value') === 'AP-123')).toBe(true)
    })
    const titelOpts = document.querySelectorAll('#qa-jira-titel-list option')
    expect(Array.from(titelOpts).some(o => o.getAttribute('value') === 'Login Feature')).toBe(true)
  })
})
