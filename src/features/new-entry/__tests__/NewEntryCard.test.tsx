import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
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

  it('renders Aufgabe as a text input (not a select)', () => {
    render(<NewEntryCard />)
    const aufgabeInput = screen.getByLabelText(/Aufgabe/i)
    expect(aufgabeInput.tagName).toBe('INPUT')
    expect(aufgabeInput).toHaveAttribute('type', 'text')
  })

  it('calls onSaved with the new entry after a valid save', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    render(<NewEntryCard onSaved={onSaved} />)

    await user.type(screen.getByLabelText(/Auftraggeber/i), 'Kunde A')
    await user.type(screen.getByLabelText(/Auftragsnr/i), 'AU-001')
    await user.type(screen.getByLabelText(/Zeitkonto/i), 'ZK-01')
    await user.clear(screen.getByLabelText(/^Start$/i))
    await user.type(screen.getByLabelText(/^Start$/i), '09:00')
    await user.type(screen.getByLabelText(/^Ende$/i), '10:00')
    await user.type(screen.getByLabelText(/Beschreibung/i), 'Etwas wichtiges')
    await user.click(screen.getByRole('button', { name: /Speichern/i }))

    expect(onSaved).toHaveBeenCalledOnce()
    expect(onSaved.mock.calls[0][0]).toMatchObject({ client: 'Kunde A', orderNo: 'AU-001' })
  })

  it('selecting a duration auto-fills Ende based on Start', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)

    // Set start to 09:00
    const startInput = screen.getByLabelText(/^Start$/i)
    await user.clear(startInput)
    await user.type(startInput, '09:00')

    // Select 1:30 h (90 minutes)
    const durationSelect = screen.getByLabelText(/Dauer/i)
    await user.selectOptions(durationSelect, '90')

    // Ende should be 10:30
    expect(screen.getByLabelText(/^Ende$/i)).toHaveValue('10:30')
  })

  it('Abbrechen resets the duration picker to placeholder', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)

    // Select a duration
    const durationSelect = screen.getByLabelText(/Dauer/i)
    await user.selectOptions(durationSelect, '60')
    expect(durationSelect).toHaveValue('60')

    // Click Abbrechen (cancel button)
    const abbrechenBtn = screen.getByRole('button', { name: /Abbrechen/i })
    await user.click(abbrechenBtn)

    // Duration picker should be reset to placeholder
    expect(durationSelect).toHaveValue('')
  })
})
