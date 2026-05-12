import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErfassungPage from '../ErfassungPage'

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
    expect(screen.getByText('Heute')).toBeInTheDocument()
    expect(screen.getByText('Diese Woche')).toBeInTheDocument()
    expect(screen.getByText('Überstunden')).toBeInTheDocument()
    expect(screen.getByText('Offene Tickets')).toBeInTheDocument()
  })
})
