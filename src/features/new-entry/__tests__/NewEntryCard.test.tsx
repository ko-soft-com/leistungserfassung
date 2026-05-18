import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import NewEntryCard from '../NewEntryCard'
import { useTimerStore } from '../../../stores/timer'

describe('NewEntryCard', () => {
  beforeEach(() => {
    useTimerStore.setState({ activeTimer: null })
  })

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

  it('renders Aufgabe as a select with all task type options', () => {
    render(<NewEntryCard />)
    const aufgabeSelect = screen.getByLabelText(/Aufgabe/i)
    expect(aufgabeSelect.tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: 'Feature' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bug-Fixing' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Meeting' })).toBeInTheDocument()
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

  it('saves successfully without a start time', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    render(<NewEntryCard onSaved={onSaved} />)

    await user.type(screen.getByLabelText(/Auftraggeber/i), 'Kunde A')
    await user.type(screen.getByLabelText(/Auftragsnr/i), 'AU-001')
    await user.type(screen.getByLabelText(/Zeitkonto/i), 'ZK-01')
    await user.clear(screen.getByLabelText(/^Start$/i))
    await user.type(screen.getByLabelText(/Beschreibung/i), 'Etwas wichtiges')
    await user.click(screen.getByRole('button', { name: /Speichern/i }))

    expect(onSaved).toHaveBeenCalledOnce()
    expect(onSaved.mock.calls[0][0].start).toBeNull()
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

  it('renders a date input defaulting to today', () => {
    render(<NewEntryCard />)
    const today = new Date().toISOString().slice(0, 10)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.value).toBe(today)
  })

  it('updates draft.date when date input changes', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
    await user.clear(dateInput)
    await user.type(dateInput, '2026-05-10')
    expect(dateInput.value).toBe('2026-05-10')
  })

})

describe('Start/Stop timer button', () => {
  beforeEach(() => {
    useTimerStore.setState({ activeTimer: null })
  })

  it('Start button sets the Start field to current time', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)

    await user.click(screen.getByRole('button', { name: /Start/i }))

    const startInput = screen.getByLabelText(/^Start$/i)
    expect((startInput as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('Start button changes to Stop after clicking', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)

    await user.click(screen.getByRole('button', { name: /Start/i }))
    expect(screen.getByRole('button', { name: /Stop/i })).toBeInTheDocument()
  })

  it('Stop button sets the Ende field to current time', async () => {
    const user = userEvent.setup()
    render(<NewEntryCard />)

    await user.click(screen.getByRole('button', { name: /Start/i }))
    await user.click(screen.getByRole('button', { name: /Stop/i }))

    const endeInput = screen.getByLabelText(/^Ende$/i)
    expect((endeInput as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('letzte suggestion button', () => {
  afterEach(() => {
    localStorage.removeItem('timesheet.lastClient')
    localStorage.removeItem('timesheet.lastOrderNo')
    localStorage.removeItem('timesheet.lastAccount')
  })

  it('clicking "letzte" fills Auftraggeber with last-used value', async () => {
    localStorage.setItem('timesheet.lastClient', 'Letzter Kunde')

    const user = userEvent.setup()
    render(<NewEntryCard />)

    const letzteBtn = screen.getByRole('button', { name: 'letzte' })
    await user.click(letzteBtn)

    expect(screen.getByLabelText(/Auftraggeber/i)).toHaveValue('Letzter Kunde')
  })

  it('clicking "letzte" fills Auftragsnr. with last-used value', async () => {
    localStorage.setItem('timesheet.lastOrderNo', 'K-999')

    const user = userEvent.setup()
    render(<NewEntryCard />)

    const letzteBtn = screen.getByRole('button', { name: 'letzte' })
    await user.click(letzteBtn)

    expect(screen.getByLabelText(/Auftragsnr/i)).toHaveValue('K-999')
  })

  it('clicking "letzte" fills Zeitkonto with last-used value', async () => {
    localStorage.setItem('timesheet.lastAccount', 'Entwicklung')

    const user = userEvent.setup()
    render(<NewEntryCard />)

    const letzteBtn = screen.getByRole('button', { name: 'letzte' })
    await user.click(letzteBtn)

    expect(screen.getByLabelText(/Zeitkonto/i)).toHaveValue('Entwicklung')
  })
})
