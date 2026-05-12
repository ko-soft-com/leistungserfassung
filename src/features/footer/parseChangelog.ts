export type ChangelogGroup = {
  heading: string
  items: string[]
}

export type ChangelogSection = {
  version: string
  groups: ChangelogGroup[]
}

export function parseChangelog(raw: string): ChangelogSection[] {
  const blocks = raw.split(/\n## /).slice(1)
  const sections: ChangelogSection[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    const version = lines[0].trim()
    const groups: ChangelogGroup[] = []
    let current: ChangelogGroup | null = null

    for (const line of lines.slice(1)) {
      if (line.startsWith('### ')) {
        if (current) groups.push(current)
        current = { heading: line.replace(/^### /, '').trim(), items: [] }
      } else if (line.startsWith('- ') && current) {
        current.items.push(line.replace(/^- /, '').trim())
      }
    }
    if (current && current.items.length > 0) groups.push(current)
    if (groups.length > 0) sections.push({ version, groups })
  }

  return sections
}
