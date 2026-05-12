import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Toolbar from '../Toolbar'

describe('Toolbar', () => {
  it('renders quick-filter options', () => {
    render(<Toolbar range="today" onRangeChange={() => {}} search="" onSearchChange={() => {}} clients={[]} selectedClient={null} onClientChange={() => {}} />)
    expect(screen.getByText('Heute')).toBeInTheDocument()
    expect(screen.getByText('Woche')).toBeInTheDocument()
    expect(screen.getByText('Monat')).toBeInTheDocument()
  })

  it('calls onRangeChange when Woche clicked', async () => {
    const fn = vi.fn()
    render(<Toolbar range="today" onRangeChange={fn} search="" onSearchChange={() => {}} clients={[]} selectedClient={null} onClientChange={() => {}} />)
    await userEvent.click(screen.getByText('Woche'))
    expect(fn).toHaveBeenCalledWith('week')
  })

  it('renders search input', () => {
    render(<Toolbar range="today" onRangeChange={() => {}} search="" onSearchChange={() => {}} clients={[]} selectedClient={null} onClientChange={() => {}} />)
    expect(screen.getByPlaceholderText(/Filter/)).toBeInTheDocument()
  })
})
