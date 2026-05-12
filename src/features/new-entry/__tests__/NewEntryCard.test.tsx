import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import NewEntryCard from '../NewEntryCard'

describe('NewEntryCard', () => {
  it('renders card header title', () => {
    render(<NewEntryCard />)
    expect(screen.getByText('Neuer Eintrag')).toBeInTheDocument()
  })

  it('renders all required field labels', () => {
    render(<NewEntryCard />)
    expect(screen.getByText('Auftraggeber')).toBeInTheDocument()
    expect(screen.getByText('Auftragsnr.')).toBeInTheDocument()
    expect(screen.getByText('Zeitkonto')).toBeInTheDocument()
  })

  it('renders Speichern and Abbrechen buttons', () => {
    render(<NewEntryCard />)
    expect(screen.getByText('Speichern')).toBeInTheDocument()
    expect(screen.getByText('Abbrechen')).toBeInTheDocument()
  })

  it('shows validation error when saving with empty required fields', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)
    await user.click(screen.getByText('Speichern'))
    const errors = screen.getAllByText('Pflichtfeld')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('resets form when Abbrechen is clicked', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)
    const clientInput = screen.getByLabelText(/Auftraggeber/i)
    await user.type(clientInput, 'TestClient')
    expect(clientInput).toHaveValue('TestClient')
    await user.click(screen.getByText('Abbrechen'))
    expect(clientInput).toHaveValue('')
  })
})
