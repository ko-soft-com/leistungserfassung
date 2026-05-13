import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppHeader from '../AppHeader'

describe('AppHeader', () => {
  it('renders brand name', () => {
    render(<AppHeader />)
    expect(screen.getByText('Leistungserfassung')).toBeInTheDocument()
  })

  it('does not render nav links', () => {
    render(<AppHeader />)
    expect(screen.queryByText('Übersicht')).not.toBeInTheDocument()
    expect(screen.queryByText('Erfassung')).not.toBeInTheDocument()
    expect(screen.queryByText('Berichte')).not.toBeInTheDocument()
    expect(screen.queryByText('Stammdaten')).not.toBeInTheDocument()
  })
})
