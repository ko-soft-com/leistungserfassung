import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddPrModal from '../QuickAddPrModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockIncrement, mockToast } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
}))

vi.mock('../../../services/firestorePullRequests', () => ({ savePullRequest: mockSave }))
vi.mock('../../../stores/refresh', () => ({
  useRefreshStore: (sel: (s: { incrementPr: () => void }) => unknown) =>
    sel({ incrementPr: mockIncrement }),
}))
vi.mock('../../../stores/toast', () => ({
  useToastStore: (sel: (s: { addToast: () => void }) => unknown) =>
    sel({ addToast: mockToast }),
}))

describe('QuickAddPrModal', () => {
  it('renders required fields', () => {
    render(<QuickAddPrModal onClose={vi.fn()} />)
    expect(screen.getByLabelText('Nummer *')).toBeDefined()
    expect(screen.getByLabelText('Titel *')).toBeDefined()
  })

  it('shows validation errors when required fields are empty', () => {
    render(<QuickAddPrModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Speichern'))
    expect(screen.getByText('Nummer ist erforderlich')).toBeDefined()
    expect(screen.getByText('Titel ist erforderlich')).toBeDefined()
  })

  it('calls savePullRequest and incrementPr on valid submit', async () => {
    mockSave.mockResolvedValueOnce({})
    render(<QuickAddPrModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Nummer *'), { target: { value: '42' } })
    fireEvent.change(screen.getByLabelText('Titel *'),  { target: { value: 'Fix login' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ nummer: '42', titel: 'Fix login' }))
      expect(mockIncrement).toHaveBeenCalled()
    })
  })

  it('shows error toast when save fails', async () => {
    mockSave.mockRejectedValueOnce(new Error('fail'))
    render(<QuickAddPrModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Nummer *'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Titel *'),  { target: { value: 'T' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('error', expect.any(String)))
  })

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn()
    const { container } = render(<QuickAddPrModal onClose={onClose} />)
    fireEvent(container.querySelector('dialog')!, new Event('close'))
    expect(onClose).toHaveBeenCalled()
  })
})
