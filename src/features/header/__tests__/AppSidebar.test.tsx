import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AppSidebar from '../AppSidebar'

describe('AppSidebar', () => {
  it('renders four nav buttons', () => {
    render(<AppSidebar currentPage="erfassung" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Zeiterfassung' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jira-Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pull Requests' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aufgaben' })).toBeInTheDocument()
  })

  it('marks the active page button with aria-current', () => {
    render(<AppSidebar currentPage="jira" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Jira-Tickets' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Zeiterfassung' })).not.toHaveAttribute('aria-current')
  })

  it('calls onNavigate with the correct page when clicked', () => {
    const onNavigate = vi.fn()
    render(<AppSidebar currentPage="erfassung" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }))
    expect(onNavigate).toHaveBeenCalledWith('prs')
  })
})
