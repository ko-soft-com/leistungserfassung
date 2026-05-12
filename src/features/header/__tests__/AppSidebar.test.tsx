import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppSidebar from '../AppSidebar'

describe('AppSidebar', () => {
  it('renders 5 navigation items', () => {
    render(<AppSidebar activeRoute="/erfassung" />)
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(5)
  })

  it('marks active route with active class', () => {
    render(<AppSidebar activeRoute="/erfassung" />)
    const erfassungBtn = screen.getByLabelText('Erfassung')
    expect(erfassungBtn.className).toMatch(/active/)
  })
})
