import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErfassungPage from '../ErfassungPage'
import * as suggestionsModule from '../../features/new-entry/suggestions'

vi.mock('../../services/firestoreTimeEntries', () => ({
  getTimeEntries: vi.fn(() => Promise.resolve([])),
  saveTimeEntry: vi.fn((data: any) => Promise.resolve({ id: 'mock-id', ...data, createdAt: 'now', updatedAt: 'now' })),
  updateTimeEntry: vi.fn((_id: string, data: any) => Promise.resolve({ id: _id, ...data, createdAt: 'now', updatedAt: 'now' })),
  deleteTimeEntry: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../services/firestoreDayRecords', () => ({
  getAllDayRecords: vi.fn(() => Promise.resolve({})),
  saveDayRecord: vi.fn((date: string, data: any) => Promise.resolve({ date, ...data })),
  getDayRecord: vi.fn(() => Promise.resolve(null)),
  migrateDayRecord: (raw: Record<string, unknown>) => {
    const date = raw.date as string
    if (Array.isArray(raw.segments)) {
      return { date, segments: raw.segments }
    }
    const segments = []
    if (raw.workStart && raw.workEnd) {
      segments.push({ start: raw.workStart as string, end: raw.workEnd as string })
    }
    return { date, segments }
  },
}))

import { getTimeEntries, saveTimeEntry, deleteTimeEntry } from '../../services/firestoreTimeEntries'
import { saveDayRecord } from '../../services/firestoreDayRecords'

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('ErfassungPage', () => {
  beforeEach(() => {
    vi.mocked(getTimeEntries).mockResolvedValue([])
    vi.mocked(saveTimeEntry).mockImplementation((data: any) =>
      Promise.resolve({ id: 'mock-id', ...data, createdAt: 'now', updatedAt: 'now' })
    )
    vi.mocked(deleteTimeEntry).mockResolvedValue(undefined)
  })

  it('renders page title', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )
    expect(screen.getByText(/Zeiterfassung/)).toBeInTheDocument()
  })

  it('renders 4 KPI cards', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )
    // 'Heute' appears in both KpiCard and Toolbar SegmentedControl
    expect(screen.getAllByText('Heute').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Diese Woche')).toBeInTheDocument()
    expect(screen.getByText('Überstunden')).toBeInTheDocument()
    expect(screen.getByText('Offene Timer')).toBeInTheDocument()
  })

  it('shows a saved entry in the table after mounting with pre-seeded data', async () => {
    const entry = {
      id: 'seeded-1',
      date: new Date().toISOString().slice(0, 10),
      start: '09:00', end: '10:00',
      client: 'Testkunde', orderNo: 'T-01', account: 'Dev',
      task: 'Feature', description: 'Irgendwas wichtiges',
      createdAt: 'now', updatedAt: 'now',
    }
    vi.mocked(getTimeEntries).mockResolvedValue([entry] as any)

    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Testkunde').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('calls setLastUsed with the most recent entry after CSV import', async () => {
    const setLastUsedSpy = vi.spyOn(suggestionsModule, 'setLastUsed')

    // Initial load: empty. During CSV duplicate-check + post-import reload: also empty (no pre-existing).
    vi.mocked(getTimeEntries).mockResolvedValue([])

    render(
      <QueryClientProvider client={makeQC()}>
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
    beforeEach(() => {
      vi.clearAllMocks()
      vi.mocked(getTimeEntries).mockResolvedValue([])
      vi.mocked(saveTimeEntry).mockImplementation((data: any) =>
        Promise.resolve({ id: 'mock-id', ...data, createdAt: 'now', updatedAt: 'now' })
      )
      vi.mocked(deleteTimeEntry).mockResolvedValue(undefined)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('removes entry from UI immediately on delete', async () => {
      const entry = {
        id: 'del-1',
        date: new Date().toISOString().slice(0, 10),
        start: '09:00', end: '10:00',
        client: 'Kunde X', orderNo: 'X-1', account: 'Dev',
        task: 'Feature', description: 'Undo test entry',
        createdAt: 'now', updatedAt: 'now',
      }
      vi.mocked(getTimeEntries).mockResolvedValue([entry] as any)

      render(
        <QueryClientProvider client={makeQC()}>
          <ErfassungPage />
        </QueryClientProvider>
      )

      await waitFor(() => expect(screen.getByText('Undo test entry')).toBeInTheDocument())

      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(screen.queryByText('Undo test entry')).not.toBeInTheDocument()
      vi.useRealTimers()
    })

    it('shows undo toast after delete', async () => {
      const entry = {
        id: 'del-2',
        date: new Date().toISOString().slice(0, 10),
        start: '09:00', end: '10:00',
        client: 'Kunde X', orderNo: 'X-1', account: 'Dev',
        task: 'Feature', description: 'Undo test entry',
        createdAt: 'now', updatedAt: 'now',
      }
      vi.mocked(getTimeEntries).mockResolvedValue([entry] as any)

      render(
        <QueryClientProvider client={makeQC()}>
          <ErfassungPage />
        </QueryClientProvider>
      )

      await waitFor(() => expect(screen.getByText('Undo test entry')).toBeInTheDocument())

      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('calls deleteTimeEntry after 5 seconds pass', async () => {
      const entry = {
        id: 'del-3',
        date: new Date().toISOString().slice(0, 10),
        start: '09:00', end: '10:00',
        client: 'Kunde X', orderNo: 'X-1', account: 'Dev',
        task: 'Feature', description: 'Undo test entry',
        createdAt: 'now', updatedAt: 'now',
      }
      vi.mocked(getTimeEntries).mockResolvedValue([entry] as any)

      render(
        <QueryClientProvider client={makeQC()}>
          <ErfassungPage />
        </QueryClientProvider>
      )

      await waitFor(() => expect(screen.getByText('Undo test entry')).toBeInTheDocument())

      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      expect(vi.mocked(deleteTimeEntry)).not.toHaveBeenCalled()
      await act(async () => { vi.advanceTimersByTime(5001) })
      expect(vi.mocked(deleteTimeEntry)).toHaveBeenCalledWith('del-3')
      vi.useRealTimers()
    })

    it('restores entry on undo click', async () => {
      const entry = {
        id: 'del-4',
        date: new Date().toISOString().slice(0, 10),
        start: '09:00', end: '10:00',
        client: 'Kunde X', orderNo: 'X-1', account: 'Dev',
        task: 'Feature', description: 'Undo test entry',
        createdAt: 'now', updatedAt: 'now',
      }
      vi.mocked(getTimeEntries).mockResolvedValue([entry] as any)

      render(
        <QueryClientProvider client={makeQC()}>
          <ErfassungPage />
        </QueryClientProvider>
      )

      await waitFor(() => expect(screen.getByText('Undo test entry')).toBeInTheDocument())

      vi.useFakeTimers()
      fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Rückgängig' })))
      vi.useRealTimers()
      expect(screen.getByText('Undo test entry')).toBeInTheDocument()
    })
  })
})

describe('duplicate entry', () => {
  beforeEach(() => {
    vi.mocked(deleteTimeEntry).mockResolvedValue(undefined)
  })

  it('creates a copy with today\'s date and null times when Duplizieren is clicked', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const original = {
      id: 'orig-1',
      date: today,
      start: '09:00', end: '10:00',
      client: 'Dupli Kunde', orderNo: 'DUP-1', account: 'Dev',
      task: 'Feature', description: 'Original entry',
      createdAt: 'now', updatedAt: 'now',
    }
    vi.mocked(getTimeEntries).mockResolvedValue([original] as any)
    vi.mocked(saveTimeEntry).mockImplementation((data: any) =>
      Promise.resolve({ id: 'duped-1', ...data, createdAt: 'now', updatedAt: 'now' })
    )

    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    await waitFor(() => expect(screen.getByText('Original entry')).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    })

    await waitFor(() => {
      expect(vi.mocked(saveTimeEntry)).toHaveBeenCalledWith(
        expect.objectContaining({
          client: 'Dupli Kunde',
          orderNo: 'DUP-1',
          date: today,
          start: null,
          end: null,
        })
      )
    })
  })
})

describe('JSON import migrates legacy day records', () => {
  it('calls saveDayRecord with segments when backup has legacy workStart/workEnd format', async () => {
    vi.mocked(getTimeEntries).mockResolvedValue([])
    vi.mocked(saveDayRecord).mockClear()

    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    const legacyBackup = JSON.stringify({
      version: 1,
      exportedAt: '2026-05-01T00:00:00.000Z',
      entries: [],
      dayRecords: {
        '2026-05-01': { date: '2026-05-01', workStart: '08:00', workEnd: '17:00' },
      },
    })

    const file = new File([legacyBackup], 'backup.json', { type: 'application/json' })
    const input = screen.getByLabelText('JSON-Backup importieren')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(vi.mocked(saveDayRecord)).toHaveBeenCalledWith(
        '2026-05-01',
        expect.objectContaining({
          segments: expect.arrayContaining([
            expect.objectContaining({ start: '08:00', end: '17:00' }),
          ]),
        })
      )
    })

    // Must NOT have been called with the raw legacy fields
    expect(vi.mocked(saveDayRecord)).not.toHaveBeenCalledWith(
      '2026-05-01',
      expect.objectContaining({ workStart: '08:00' })
    )
  })
})

describe('CSV import duplicate handling', () => {
  it('switches to Alle and shows duplicate message when all CSV entries already exist', async () => {
    const existing = {
      id: 'exist-1',
      date: '2026-01-01',
      start: '09:00', end: '10:00',
      client: 'AltKunde', orderNo: 'ALT-1', account: 'Dev',
      task: 'Feature', description: 'Schon vorhanden',
      createdAt: 'now', updatedAt: 'now',
    }
    vi.mocked(getTimeEntries).mockResolvedValue([existing] as any)

    render(
      <QueryClientProvider client={makeQC()}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      // Entry from 2026-01-01 is outside current week so not visible initially
      // but we just wait for loading to be done
      expect(vi.mocked(getTimeEntries)).toHaveBeenCalled()
    })

    const csvContent = [
      'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr',
      '2026-01-01,09:00,10:00,AltKunde,ALT-1,Dev,Feature,1,0,Schon vorhanden,,,',
    ].join('\n')

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSV-Datei importieren')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/bereits vorhanden/)
    })

    // Entry from 2026-01-01 (outside current week) is now visible — proves range switched to 'all'
    expect(screen.getByText('Schon vorhanden')).toBeInTheDocument()
  })
})
