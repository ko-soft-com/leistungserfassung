import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppFooter from '../AppFooter'

describe('AppFooter', () => {
  it('renders a contentinfo landmark', () => {
    render(<AppFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('displays the app name and version', () => {
    render(<AppFooter />)
    expect(screen.getByText(/Leistungserfassung · v[\d.]+/)).toBeInTheDocument()
  })

  it('has a changelog trigger button', () => {
    render(<AppFooter />)
    expect(screen.getByRole('button', { name: /Was ist neu/i })).toBeInTheDocument()
  })
})
