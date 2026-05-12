import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErfassungPage from '../ErfassungPage'
import { saveTimeEntry } from '../../services/storage'

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
    expect(screen.getByText('Testkunde')).toBeInTheDocument()
  })
})
