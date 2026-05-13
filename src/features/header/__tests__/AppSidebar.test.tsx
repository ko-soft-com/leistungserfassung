import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppSidebar from '../AppSidebar'

describe('AppSidebar', () => {
  it('renders without nav links', () => {
    render(<AppSidebar />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})
