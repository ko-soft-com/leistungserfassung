import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddPrModal from '../QuickAddPrModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockGetPrs, mockIncrement, mockToast } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockGetPrs:    vi.fn().mockResolvedValue([]),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
}))

vi.mock('../../../services/firestorePullRequests', () => ({
  savePullRequest: mockSave,
  getPullRequests: mockGetPrs,
}))
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

  it('shows nummer, titel and reviewer suggestions from existing PRs', async () => {
    mockGetPrs.mockResolvedValueOnce([
      {
        id: '1', nummer: '99', titel: 'Add OAuth', status: 'Open',
        reviewer: 'alice', kommentar: '', history: [],
        faelligkeitsdatum: null, createdAt: '', updatedAt: '',
      },
    ])
    render(<QuickAddPrModal onClose={vi.fn()} />)
    await waitFor(() => {
      const nummerOpts   = document.querySelectorAll('#qa-pr-nummer-list option')
      const titelOpts    = document.querySelectorAll('#qa-pr-titel-list option')
      const reviewerOpts = document.querySelectorAll('#qa-pr-reviewer-list option')
      expect(Array.from(nummerOpts).some(o => o.getAttribute('value') === '99')).toBe(true)
      expect(Array.from(titelOpts).some(o => o.getAttribute('value') === 'Add OAuth')).toBe(true)
      expect(Array.from(reviewerOpts).some(o => o.getAttribute('value') === 'alice')).toBe(true)
    })
  })
})
