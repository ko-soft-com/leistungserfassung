# JSON Backup Export/Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JSON export and import that backs up both TimeEntry records and Gleitzeit DayRecord data in one file, with merge-on-import behaviour.

**Architecture:** A new pure-function utility `src/utils/backup.ts` handles serialisation/deserialisation. `src/services/dayRecords.ts` exposes its private `getAll()` as `getAllDayRecords()`. `ErfassungPage.tsx` wires two new handlers and two new buttons next to the existing CSV buttons.

**Tech Stack:** React 18, TypeScript, Vitest, `@testing-library/react`, localStorage via existing service layer.

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `src/services/dayRecords.ts` | Export `getAllDayRecords()` |
| Create | `src/utils/backup.ts` | `exportToJson` + `importFromJson` pure functions |
| Create | `src/utils/backup.test.ts` | 6 unit tests |
| Modify | `src/pages/ErfassungPage.tsx` | `jsonFileInputRef`, `handleJsonExport`, `handleJsonFileChange`, 2 buttons, 1 file input |

---

## Task 1: Expose `getAllDayRecords` in dayRecords service

**Files:**
- Modify: `src/services/dayRecords.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/services/dayRecords.test.ts` (after the existing `afterEach`):

```typescript
it('getAllDayRecords returns all saved records', () => {
  saveDayRecord('2026-05-19', { workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 })
  saveDayRecord('2026-05-20', { workStart: '09:00', workEnd: '18:00', pauseMinutes: 0 })
  const all = getAllDayRecords()
  expect(Object.keys(all)).toHaveLength(2)
  expect(all['2026-05-19'].workStart).toBe('08:00')
})
```

Also add `getAllDayRecords` to the import at the top of the test file:
```typescript
import { getDayRecord, saveDayRecord, getAllDayRecords } from './dayRecords'
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/dayRecords.test.ts
```

Expected: FAIL — `getAllDayRecords` is not exported.

- [ ] **Step 3: Implement `getAllDayRecords`**

Add to the end of `src/services/dayRecords.ts`:

```typescript
export function getAllDayRecords(): Record<string, DayRecord> {
  return getAll()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/dayRecords.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/dayRecords.ts src/services/dayRecords.test.ts
git commit -m "feat(dayRecords): expose getAllDayRecords for backup export"
```

---

## Task 2: `backup.ts` utility — pure export/import functions

**Files:**
- Create: `src/utils/backup.ts`
- Create: `src/utils/backup.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/backup.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { exportToJson, importFromJson } from './backup'
import type { TimeEntry } from '../types/entry'
import type { DayRecord } from '../types/dayRecord'

const entry: TimeEntry = {
  id: '1', date: '2026-05-19', start: '08:00', end: '09:30',
  client: 'WASCOSA', orderNo: 'SP 07', account: '#WX-225',
  task: 'Feature', description: 'Test', createdAt: 'x', updatedAt: 'x',
}
const dayRecord: DayRecord = {
  date: '2026-05-19', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30,
}

describe('exportToJson', () => {
  it('produces valid JSON with version, exportedAt, entries, dayRecords', () => {
    const json = exportToJson([entry], { '2026-05-19': dayRecord })
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(typeof parsed.exportedAt).toBe('string')
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].id).toBe('1')
    expect(parsed.dayRecords['2026-05-19']).toEqual(dayRecord)
  })

  it('handles empty inputs', () => {
    const json = exportToJson([], {})
    const parsed = JSON.parse(json)
    expect(parsed.entries).toEqual([])
    expect(parsed.dayRecords).toEqual({})
  })
})

describe('importFromJson', () => {
  it('round-trips an export', () => {
    const json = exportToJson([entry], { '2026-05-19': dayRecord })
    const { entries, dayRecords } = importFromJson(json)
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('1')
    expect(dayRecords['2026-05-19']).toEqual(dayRecord)
  })

  it('throws on invalid JSON string', () => {
    expect(() => importFromJson('not json')).toThrow('Die Datei ist kein gültiges JSON.')
  })

  it('throws when version field is missing', () => {
    expect(() => importFromJson('{"entries":[]}')).toThrow('Unbekanntes Backup-Format (kein version-Feld).')
  })

  it('returns empty collections for empty arrays/objects', () => {
    const json = exportToJson([], {})
    const { entries, dayRecords } = importFromJson(json)
    expect(entries).toEqual([])
    expect(dayRecords).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/backup.test.ts
```

Expected: FAIL — module `./backup` not found.

- [ ] **Step 3: Implement `src/utils/backup.ts`**

Create `src/utils/backup.ts`:

```typescript
import type { TimeEntry } from '../types/entry'
import type { DayRecord } from '../types/dayRecord'

interface BackupFile {
  version: number
  exportedAt: string
  entries: TimeEntry[]
  dayRecords: Record<string, DayRecord>
}

export function exportToJson(
  entries: TimeEntry[],
  dayRecords: Record<string, DayRecord>
): string {
  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    dayRecords,
  }
  return JSON.stringify(backup, null, 2)
}

export function importFromJson(text: string): {
  entries: TimeEntry[]
  dayRecords: Record<string, DayRecord>
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    throw new Error('Unbekanntes Backup-Format (kein version-Feld).')
  }
  const backup = parsed as BackupFile
  return {
    entries: backup.entries ?? [],
    dayRecords: backup.dayRecords ?? {},
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/backup.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/backup.ts src/utils/backup.test.ts
git commit -m "feat(backup): add exportToJson and importFromJson utility functions"
```

---

## Task 3: Wire JSON export/import into ErfassungPage

**Files:**
- Modify: `src/pages/ErfassungPage.tsx`

**Context:** `ErfassungPage.tsx` currently has:
- Line 4: `import { Download, Upload } from 'lucide-react'`
- Line 15: `import { exportTimeEntriesToCsv, importTimeEntriesFromCsv } from '../utils/csv'`
- Line 43: `const fileInputRef = useRef<HTMLInputElement>(null)`
- Lines 45–60: `handleExport` (CSV)
- Lines 62–105: `handleFileChange` (CSV import)
- Lines 223–236: CSV buttons + hidden CSV file input in JSX

- [ ] **Step 1: Add imports**

At the top of `src/pages/ErfassungPage.tsx`, add after the existing `import` for `../utils/csv`:

```typescript
import { exportToJson, importFromJson } from '../utils/backup'
import { getAllDayRecords, saveDayRecord } from '../services/dayRecords'
```

- [ ] **Step 2: Add `jsonFileInputRef`**

After line 43 (`const fileInputRef = useRef<HTMLInputElement>(null)`), add:

```typescript
const jsonFileInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 3: Add `handleJsonExport`**

After the `handleFileChange` function (around line 105), add:

```typescript
const handleJsonExport = () => {
  setCsvMessage(null)
  const dayRecords = getAllDayRecords()
  const json = exportToJson(entries, dayRecords)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const exportDate = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `leistungserfassung-backup-${exportDate}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
  const dayCount = Object.keys(dayRecords).length
  setCsvMessage(`Backup exportiert (${entries.length} Einträge, ${dayCount} Tageszeiten).`)
}
```

- [ ] **Step 4: Add `handleJsonFileChange`**

After `handleJsonExport`, add:

```typescript
const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setCsvMessage(null)
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onerror = () => setCsvMessage('Fehler beim Lesen der Datei.')
  reader.onload = (ev) => {
    try {
      const text = ev.target?.result as string
      const { entries: importedEntries, dayRecords: importedDayRecords } = importFromJson(text)
      const currentEntries = getTimeEntries()
      let dupSkipped = 0
      const toImport = importedEntries.filter((data) => {
        if (isDuplicate(data, currentEntries)) {
          dupSkipped++
          return false
        }
        return true
      })
      toImport.forEach((data) => saveTimeEntry(data))
      Object.entries(importedDayRecords).forEach(([date, record]) => {
        const { date: _date, ...rest } = record
        saveDayRecord(date, rest)
      })
      if (toImport.length > 0) setEntries(getTimeEntries())
      const dayCount = Object.keys(importedDayRecords).length
      const parts: string[] = []
      if (toImport.length > 0) parts.push(`${toImport.length} Einträge`)
      if (dayCount > 0) parts.push(`${dayCount} Tageszeiten`)
      if (dupSkipped > 0) parts.push(`${dupSkipped} Duplikate übersprungen`)
      setCsvMessage(
        parts.length > 0
          ? `Backup importiert: ${parts.join(', ')}.`
          : 'Backup enthält keine neuen Daten.'
      )
    } catch (err) {
      setCsvMessage(err instanceof Error ? err.message : 'Die Datei konnte nicht importiert werden.')
    }
  }
  reader.readAsText(file, 'utf-8')
  e.target.value = ''
}
```

- [ ] **Step 5: Add buttons and file input in JSX**

In the JSX section, after the existing CSV import `<input>` (around line 236), add two new buttons and a JSON file input. The complete `titleActions` div should look like this:

```tsx
<div className={styles.titleActions}>
  <Button variant="secondary" onClick={handleExport}>
    <Download size={14} /> CSV exportieren
  </Button>
  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
    <Upload size={14} /> CSV importieren
  </Button>
  <input
    ref={fileInputRef}
    type="file"
    accept=".csv"
    aria-label="CSV-Datei importieren"
    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
    onChange={handleFileChange}
  />
  <Button variant="secondary" onClick={handleJsonExport}>
    <Download size={14} /> JSON exportieren
  </Button>
  <Button variant="secondary" onClick={() => jsonFileInputRef.current?.click()}>
    <Upload size={14} /> JSON importieren
  </Button>
  <input
    ref={jsonFileInputRef}
    type="file"
    accept=".json"
    aria-label="JSON-Backup importieren"
    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
    onChange={handleJsonFileChange}
  />
  {pendingDelete && (
    <span role="status" aria-live="polite" style={{ fontSize: '0.875rem', color: 'var(--clr-text-sec)' }}>
      Eintrag gelöscht.{' '}
      <button
        type="button"
        onClick={handleUndoDelete}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}
      >
        Rückgängig
      </button>
    </span>
  )}
  {!pendingDelete && csvMessage && (
    <span role="status" aria-live="polite" style={{ fontSize: '0.875rem', color: 'var(--clr-text-sec)' }}>
      {csvMessage}
    </span>
  )}
</div>
```

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass (229+).

- [ ] **Step 7: Commit**

```bash
git add src/pages/ErfassungPage.tsx
git commit -m "feat(backup): add JSON export/import buttons to ErfassungPage"
```
