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

  it('renders a client select when clients provided', () => {
    render(<Toolbar range="today" onRangeChange={() => {}} search="" onSearchChange={() => {}} clients={['WASCOSA', 'Siemens']} selectedClient={null} onClientChange={() => {}} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Alle Auftraggeber')).toBeInTheDocument()
    expect(screen.getByText('WASCOSA')).toBeInTheDocument()
  })

  it('calls onClientChange with client name when selected', async () => {
    const user = userEvent.setup()
    const fn = vi.fn()
    render(<Toolbar range="today" onRangeChange={() => {}} search="" onSearchChange={() => {}} clients={['WASCOSA', 'Siemens']} selectedClient={null} onClientChange={fn} />)
    await user.selectOptions(screen.getByRole('combobox'), 'WASCOSA')
    expect(fn).toHaveBeenCalledWith('WASCOSA')
  })

  it('calls onClientChange with null when "Alle" selected', async () => {
    const user = userEvent.setup()
    const fn = vi.fn()
    render(<Toolbar range="today" onRangeChange={() => {}} search="" onSearchChange={() => {}} clients={['WASCOSA']} selectedClient="WASCOSA" onClientChange={fn} />)
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(fn).toHaveBeenCalledWith(null)
  })
})
