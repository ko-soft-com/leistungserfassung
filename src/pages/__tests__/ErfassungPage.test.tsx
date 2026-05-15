import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErfassungPage from '../ErfassungPage'
import { saveTimeEntry, getTimeEntries } from '../../services/storage'
import * as suggestionsModule from '../../features/new-entry/suggestions'

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('ErfassungPage', () => {
  it('renders page title', () => {
    render(
      <QueryClientProvider client={qc}>
        <ErfassungPage />
      </QueryClientProvider>
    )
    expect(screen.getByText(/Zeiterfassung/)).toBeInTheDocument()
  })

  it('renders 4 KPI cards', () => {
    render(
      <QueryClientProvider client={qc}>
        <ErfassungPage />
      </QueryClientProvider>
    )
    // 'Heute' appears in both KpiCard and Toolbar SegmentedControl
    expect(screen.getAllByText('Heute').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Diese Woche')).toBeInTheDocument()
    expect(screen.getByText('Überstunden')).toBeInTheDocument()
    expect(screen.getByText('Offene Timer')).toBeInTheDocument()
  })

  it('shows a saved entry in the table after mounting with pre-seeded localStorage', () => {
    saveTimeEntry({
      date: new Date().toISOString().slice(0, 10),
      start: '09:00', end: '10:00',
      client: 'Testkunde', orderNo: 'T-01', account: 'Dev',
      task: 'Feature', description: 'Irgendwas wichtiges',
    })
    render(
      <QueryClientProvider client={qc}>
        <ErfassungPage />
      </QueryClientProvider>
    )
    expect(screen.getAllByText('Testkunde').length).toBeGreaterThanOrEqual(1)
  })

  it('calls setLastUsed with the most recent entry after CSV import', async () => {
    const setLastUsedSpy = vi.spyOn(suggestionsModule, 'setLastUsed')

    render(
      <QueryClientProvider client={qc}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    const csvContent = [
      'date,start,end,client,orderNo,order,account,task,hours,minutes,description,externalId,jira,pr',
      '2026-05-10,09:00,10:00,OldClient,OLD-1,Auftrag Alt,Konto Alt,Feature,1,0,,,, ',
      '2026-05-15,10:00,11:00,NewClient,NEW-99,Auftrag Neu,Konto Neu,Bug,1,0,,,,',
    ].join('\n')

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSV-Datei importieren')

    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(setLastUsedSpy).toHaveBeenCalledWith({
        client: 'NewClient',
        orderNo: 'NEW-99',
        account: 'Konto Neu',
      })
    })

    setLastUsedSpy.mockRestore()
  })

  describe('delete with undo', () => {
    afterEach(() => {
      vi.useRealTimers()
      localStorage.clear()
    })

    it('removes entry from UI immediately on delete', async () => {
      saveTimeEntry({ date: '2026-05-15', start: '09:00', end: '10:00', client: 'Kunde X', orderNo: 'X-1', account: 'Dev', task: 'Feature', description: 'Undo test entry' })
      render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ErfassungPage /></QueryClientProvider>)
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(screen.queryByText('Undo test entry')).not.toBeInTheDocument()
      vi.useRealTimers()
    })

    it('shows undo toast after delete', async () => {
      saveTimeEntry({ date: '2026-05-15', start: '09:00', end: '10:00', client: 'Kunde X', orderNo: 'X-1', account: 'Dev', task: 'Feature', description: 'Undo test entry' })
      render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ErfassungPage /></QueryClientProvider>)
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('does not delete from storage until 5 seconds pass', async () => {
      const saved = saveTimeEntry({ date: '2026-05-15', start: '09:00', end: '10:00', client: 'Kunde X', orderNo: 'X-1', account: 'Dev', task: 'Feature', description: 'Undo test entry' })
      render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ErfassungPage /></QueryClientProvider>)
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(getTimeEntries().find(e => e.id === saved.id)).toBeDefined()
      act(() => vi.advanceTimersByTime(5001))
      expect(getTimeEntries().find(e => e.id === saved.id)).toBeUndefined()
      vi.useRealTimers()
    })

    it('restores entry on undo click', async () => {
      const saved = saveTimeEntry({ date: '2026-05-15', start: '09:00', end: '10:00', client: 'Kunde X', orderNo: 'X-1', account: 'Dev', task: 'Feature', description: 'Undo test entry' })
      render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ErfassungPage /></QueryClientProvider>)
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Rückgängig' })))
      vi.useRealTimers()
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
      expect(getTimeEntries().find(e => e.id === saved.id)).toBeDefined()
    })
  })
})
