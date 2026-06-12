import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickAddZeitModal from '../QuickAddZeitModal'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const { mockSave, mockIncrement, mockToast } = vi.hoisted(() => ({
  mockSave:      vi.fn(),
  mockIncrement: vi.fn(),
  mockToast:     vi.fn(),
}))

vi.mock('../../../services/firestoreTimeEntries', () => ({ saveTimeEntry: mockSave }))
vi.mock('../../../stores/refresh', () => ({
  useRefreshStore: (sel: (s: { incrementZeit: () => void }) => unknown) =>
    sel({ incrementZeit: mockIncrement }),
}))
vi.mock('../../../stores/toast', () => ({
  useToastStore: (sel: (s: { addToast: () => void }) => unknown) =>
    sel({ addToast: mockToast }),
}))

describe('QuickAddZeitModal', () => {
  it('renders required fields', () => {
    render(<QuickAddZeitModal onClose={vi.fn()} />)
    expect(screen.getByLabelText('Auftraggeber', { exact: false })).toBeDefined()
    expect(screen.getByLabelText('Auftragsnr.', { exact: false })).toBeDefined()
    expect(screen.getByLabelText('Zeitkonto', { exact: false })).toBeDefined()
  })

  it('shows validation errors when required fields are empty', () => {
    render(<QuickAddZeitModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Speichern'))
    expect(screen.getAllByText('Pflichtfeld').length).toBeGreaterThan(0)
  })

  it('calls saveTimeEntry and incrementZeit on valid submit', async () => {
    mockSave.mockResolvedValueOnce({})
    render(<QuickAddZeitModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Auftraggeber', { exact: false }), { target: { value: 'Kunde AG' } })
    fireEvent.change(screen.getByLabelText('Auftragsnr.', { exact: false }),  { target: { value: '4711' } })
    fireEvent.change(screen.getByLabelText('Zeitkonto', { exact: false }),    { target: { value: 'Dev' } })
    fireEvent.change(screen.getByLabelText('Beschreibung'), { target: { value: 'Feature XY implementiert' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        client: 'Kunde AG', orderNo: '4711', account: 'Dev',
      }))
      expect(mockIncrement).toHaveBeenCalled()
    })
  })

  it('shows error toast when save fails', async () => {
    mockSave.mockRejectedValueOnce(new Error('fail'))
    render(<QuickAddZeitModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Auftraggeber', { exact: false }), { target: { value: 'K' } })
    fireEvent.change(screen.getByLabelText('Auftragsnr.', { exact: false }),  { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Zeitkonto', { exact: false }),    { target: { value: 'Z' } })
    fireEvent.change(screen.getByLabelText('Beschreibung'), { target: { value: 'Lang genug' } })
    fireEvent.click(screen.getByText('Speichern'))
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('error', expect.any(String)))
  })

  it('calls onClose when dialog fires close event', () => {
    const onClose = vi.fn()
    const { container } = render(<QuickAddZeitModal onClose={onClose} />)
    fireEvent(container.querySelector('dialog')!, new Event('close'))
    expect(onClose).toHaveBeenCalled()
  })
})
