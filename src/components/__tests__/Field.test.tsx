import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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

  it('passes type prop to input via label', () => {
    render(<Field label="Start" value="09:00" onChange={() => {}} type="time" />)
    expect(screen.getByLabelText('Start')).toHaveAttribute('type', 'time')
  })

  it('renders suggestion as button when onSuggestionClick is provided', () => {
    const onClick = vi.fn()
    render(<Field label="X" value="" onChange={() => {}} suggestion="letzte" onSuggestionClick={onClick} />)
    expect(screen.getByRole('button', { name: 'letzte' })).toBeInTheDocument()
  })

  it('renders suggestion as span when no onSuggestionClick', () => {
    render(<Field label="X" value="" onChange={() => {}} suggestion="letzte" />)
    expect(screen.queryByRole('button', { name: 'letzte' })).not.toBeInTheDocument()
    expect(screen.getByText('letzte')).toBeInTheDocument()
  })
})
