import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SegmentedControl from '../SegmentedControl'

describe('SegmentedControl', () => {
  const options = [
    { label: 'Heute', value: 'today' },
    { label: 'Woche', value: 'week' },
  ]

  it('renders all options', () => {
    render(<SegmentedControl options={options} value="today" onChange={() => {}} />)
    expect(screen.getByText('Heute')).toBeInTheDocument()
    expect(screen.getByText('Woche')).toBeInTheDocument()
  })

  it('calls onChange on click', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="today" onChange={onChange} />)
    await userEvent.click(screen.getByText('Woche'))
    expect(onChange).toHaveBeenCalledWith('week')
  })
})
