import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TaskTypeSelector from '../TaskTypeSelector'

describe('TaskTypeSelector', () => {
  it('renders all 4 task type options', () => {
    render(<TaskTypeSelector value="Feature" onChange={() => {}} />)
    expect(screen.getByLabelText('Bug-Fixing')).toBeInTheDocument()
    expect(screen.getByLabelText('Feature')).toBeInTheDocument()
    expect(screen.getByLabelText('Review')).toBeInTheDocument()
    expect(screen.getByLabelText('Meeting')).toBeInTheDocument()
  })

  it('marks the current value as checked', () => {
    render(<TaskTypeSelector value="Review" onChange={() => {}} />)
    expect(screen.getByLabelText<HTMLInputElement>('Review').checked).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>('Feature').checked).toBe(false)
  })

  it('calls onChange when a different option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaskTypeSelector value="Feature" onChange={onChange} />)
    await user.click(screen.getByLabelText('Bug-Fixing'))
    expect(onChange).toHaveBeenCalledWith('Bug-Fixing')
  })

  it('uses the provided name for radio group', () => {
    render(<TaskTypeSelector value="Meeting" onChange={() => {}} name="myTask" />)
    const inputs = screen.getAllByRole('radio')
    inputs.forEach(input => expect((input as HTMLInputElement).name).toBe('myTask'))
  })
})
