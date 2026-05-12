import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import ChangelogDialog from '../ChangelogDialog'

const SAMPLE = `# Changelog

## [Unreleased]

### Added
- New feature A
- New feature B

### Fixed
- Bug X was resolved
`

describe('ChangelogDialog', () => {
  it('renders the trigger button', () => {
    render(<ChangelogDialog changelogRaw={SAMPLE} />)
    expect(screen.getByRole('button', { name: /Was ist neu/i })).toBeInTheDocument()
  })

  it('dialog is closed initially', () => {
    render(<ChangelogDialog changelogRaw={SAMPLE} />)
    expect(screen.queryByText('Neuigkeiten')).not.toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<ChangelogDialog changelogRaw={SAMPLE} />)
    await user.click(screen.getByRole('button', { name: /Was ist neu/i }))
    expect(screen.getByText('Neuigkeiten')).toBeInTheDocument()
  })

  it('shows changelog content in open dialog', async () => {
    const user = userEvent.setup()
    render(<ChangelogDialog changelogRaw={SAMPLE} />)
    await user.click(screen.getByRole('button', { name: /Was ist neu/i }))
    expect(screen.getByText('[Unreleased]')).toBeInTheDocument()
    expect(screen.getByText('Added')).toBeInTheDocument()
    expect(screen.getByText('New feature A')).toBeInTheDocument()
    expect(screen.getByText('Bug X was resolved')).toBeInTheDocument()
  })

  it('closes dialog when X button clicked', async () => {
    const user = userEvent.setup()
    render(<ChangelogDialog changelogRaw={SAMPLE} />)
    await user.click(screen.getByRole('button', { name: /Was ist neu/i }))
    expect(screen.getByText('Neuigkeiten')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Schließen/i }))
    expect(screen.queryByText('Neuigkeiten')).not.toBeInTheDocument()
  })
})
