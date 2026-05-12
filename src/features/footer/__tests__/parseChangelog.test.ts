import { describe, it, expect } from 'vitest'
import { parseChangelog } from '../parseChangelog'

const SAMPLE = `# Changelog

All notable changes.

## [Unreleased]

### Added
- Feature A with description
- Feature B

### Fixed
- Bug C was resolved

## [0.1.0] - 2024-01-01

### Changed
- Something changed
`

describe('parseChangelog', () => {
  it('returns one section per ## heading', () => {
    expect(parseChangelog(SAMPLE)).toHaveLength(2)
  })

  it('extracts version string from each section', () => {
    const result = parseChangelog(SAMPLE)
    expect(result[0].version).toBe('[Unreleased]')
    expect(result[1].version).toBe('[0.1.0] - 2024-01-01')
  })

  it('extracts groups with headings and items', () => {
    const result = parseChangelog(SAMPLE)
    expect(result[0].groups).toHaveLength(2)
    expect(result[0].groups[0].heading).toBe('Added')
    expect(result[0].groups[0].items).toEqual(['Feature A with description', 'Feature B'])
    expect(result[0].groups[1].heading).toBe('Fixed')
    expect(result[0].groups[1].items).toEqual(['Bug C was resolved'])
  })

  it('returns empty array for empty string', () => {
    expect(parseChangelog('')).toEqual([])
  })

  it('filters out sections that have no list items', () => {
    const noItems = `# Changelog\n\n## [Unreleased]\n\n_No changes yet._\n`
    expect(parseChangelog(noItems)).toEqual([])
  })

  it('handles JIRA-prefixed items without special treatment', () => {
    const withJira = `# Changelog\n\n## [1.0.0]\n\n### Added\n- [LEIS-30] Docker image added\n`
    const result = parseChangelog(withJira)
    expect(result[0].groups[0].items[0]).toBe('[LEIS-30] Docker image added')
  })

  it('excludes empty groups (headings with no items) from results', () => {
    const withEmptyGroup = `# Changelog\n\n## [1.0.0]\n\n### Added\n\n### Fixed\n- Bug fixed\n`
    const result = parseChangelog(withEmptyGroup)
    expect(result[0].groups).toHaveLength(1)
    expect(result[0].groups[0].heading).toBe('Fixed')
  })
})
