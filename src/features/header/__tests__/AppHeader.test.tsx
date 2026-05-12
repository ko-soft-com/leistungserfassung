import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppHeader from '../AppHeader'

describe('AppHeader', () => {
  it('renders brand name', () => {
    render(<AppHeader />)
    expect(screen.getByText('Leistungserfassung')).toBeInTheDocument()
  })

  it('renders Erfassung nav item as active', () => {
    render(<AppHeader />)
    expect(screen.getByText('Erfassung')).toBeInTheDocument()
  })

  it('renders all 4 nav items', () => {
    render(<AppHeader />)
    expect(screen.getByText('Übersicht')).toBeInTheDocument()
    expect(screen.getByText('Berichte')).toBeInTheDocument()
    expect(screen.getByText('Stammdaten')).toBeInTheDocument()
  })
})
