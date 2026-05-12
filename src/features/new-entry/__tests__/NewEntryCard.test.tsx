import { render, screen } from '@testing-library/react'
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
})
