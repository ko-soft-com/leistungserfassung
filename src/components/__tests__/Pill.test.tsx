import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Pill from '../Pill'

describe('Pill', () => {
  it('renders label', () => {
    render(<Pill variant="task" taskType="Feature">Feature</Pill>)
    expect(screen.getByText('Feature')).toBeInTheDocument()
  })

  it('applies task-feat styles for Feature', () => {
    const { container } = render(<Pill variant="task" taskType="Feature">Feature</Pill>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/feat/)
  })
})
