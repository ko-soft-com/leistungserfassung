import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EntryRow from '../EntryRow'
import type { TimeEntry } from '../../../types/entry'

const entry: TimeEntry = {
  id: '1',
  date: '2026-05-12',
  start: '08:00',
  end: '09:30',
  client: 'WASCOSA',
  orderNo: 'SP 07',
  account: '#WX-225',
  task: 'Feature',
  description: 'Auth implementation for login page',
  jira: 'WX-352',
  pr: '474',
  createdAt: '',
  updatedAt: '',
}

describe('EntryRow', () => {
  it('renders 3 text lines in main column', () => {
    render(<EntryRow entry={entry} onEdit={() => {}} onDelete={() => {}} />)
    const lines = document.querySelectorAll('[data-line]')
    expect(lines.length).toBe(3)
  })

  it('renders duration as H:MMh', () => {
    render(<EntryRow entry={entry} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('1:30h')).toBeInTheDocument()
  })

  it('renders JIRA reference', () => {
    render(<EntryRow entry={entry} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('WX-352')).toBeInTheDocument()
  })

  it('renders client name', () => {
    render(<EntryRow entry={entry} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('WASCOSA')).toBeInTheDocument()
  })
})
