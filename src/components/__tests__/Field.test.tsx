import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Field from '../Field'

describe('Field', () => {
  it('renders label and input', () => {
    render(<Field label="Auftraggeber" value="" onChange={() => {}} />)
    expect(screen.getByText('Auftraggeber')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows required asterisk', () => {
    render(<Field label="Auftraggeber" required value="" onChange={() => {}} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Field label="Auftraggeber" error="Pflichtfeld" value="" onChange={() => {}} />)
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument()
  })

  it('renders textarea when multiline', () => {
    render(<Field label="Beschreibung" multiline value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })
})
