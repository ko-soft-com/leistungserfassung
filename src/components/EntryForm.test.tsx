import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryForm from './EntryForm'
import type { EintragFormData } from '../types/entry'

const mockOnSave = vi.fn()

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/Auftraggeber/i), 'Kunde A')
  await userEvent.type(screen.getByLabelText(/Auftragsnummer/i), 'AU-001')
  await userEvent.type(screen.getByLabelText(/^Auftrag$/i), 'Website')
  await userEvent.type(screen.getByLabelText(/Zeitkonto/i), 'ZK-01')
  await userEvent.type(screen.getByLabelText(/Aufgabe/i), 'Frontend')
  await userEvent.clear(screen.getByLabelText(/Stunden/i))
  await userEvent.type(screen.getByLabelText(/Stunden/i), '2')
  await userEvent.clear(screen.getByLabelText(/Minuten/i))
  await userEvent.type(screen.getByLabelText(/Minuten/i), '30')
}

describe('EntryForm', () => {
  it('renders all 9 form fields', () => {
    render(<EntryForm onSave={mockOnSave} />)
    expect(screen.getByLabelText(/Auftraggeber/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Auftragsnummer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Auftrag$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Zeitkonto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Aufgabe/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Datum/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Stunden/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Minuten/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Beschreibung/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Externe.ID/i)).toBeInTheDocument()
  })

  it('calls onSave with form data on submit', async () => {
    render(<EntryForm onSave={mockOnSave} />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Speichern/i }))
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        auftraggeber: 'Kunde A',
        auftragsnummer: 'AU-001',
        dauer: { stunden: 2, minuten: 30 },
      })
    )
  })

  it('shows Aktualisieren button in edit mode', () => {
    const initialData: EintragFormData = {
      auftraggeber: 'K', auftragsnummer: 'A', auftrag: 'B',
      zeitkonto: 'Z', aufgabe: 'T', datum: '2026-05-11',
      dauer: { stunden: 1, minuten: 0 },
    }
    render(<EntryForm onSave={mockOnSave} initialData={initialData} />)
    expect(screen.getByRole('button', { name: /Aktualisieren/i })).toBeInTheDocument()
  })
})
