import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import KpiCard from '../KpiCard'

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Heute" value="2:45h" sublabel="von 8h Soll" progress={0.34} />)
    expect(screen.getByText('Heute')).toBeInTheDocument()
    expect(screen.getByText('2:45h')).toBeInTheDocument()
    expect(screen.getByText('von 8h Soll')).toBeInTheDocument()
  })
})
