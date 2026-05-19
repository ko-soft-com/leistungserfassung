import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import IssueTypeSelector from '../IssueTypeSelector'

describe('IssueTypeSelector', () => {
  it('renders Epic, Story, Task radio buttons', () => {
    render(<IssueTypeSelector value={undefined} onChange={() => {}} />)
    expect(screen.getByLabelText('Epic')).toBeInTheDocument()
    expect(screen.getByLabelText('Story')).toBeInTheDocument()
    expect(screen.getByLabelText('Task')).toBeInTheDocument()
  })

  it('calls onChange with the selected type', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IssueTypeSelector value={undefined} onChange={onChange} />)
    await user.click(screen.getByLabelText('Story'))
    expect(onChange).toHaveBeenCalledWith('Story')
  })

  it('calls onChange with undefined when clicking the already-selected type', () => {
    const onChange = vi.fn()
    render(<IssueTypeSelector value="Epic" onChange={onChange} />)
    // fireEvent.click triggers the onClick handler; clicking an already-checked
    // radio does not fire onChange in browsers, so only onClick deselects it
    fireEvent.click(screen.getByLabelText('Epic'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})
