# Duplicate Entry + Incomplete Row Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Duplizieren button to copy an entry to today (no times), and highlight table rows red when any mandatory field is empty.

**Architecture:** Three-layer change — EntryRow gets two new props (`onDuplicate`, `isIncomplete`); EntryTable threads `onDuplicate` and computes `isIncomplete` per entry inline; ErfassungPage implements `handleDuplicate`. No new components or types needed.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + @testing-library/react

---

## File Map

| File | Change |
|------|--------|
| `src/features/entry-list/EntryRow.tsx` | Add `onDuplicate?` + `isIncomplete?` props; wire button; conditional class |
| `src/features/entry-list/EntryRow.module.css` | Add `.rowIncomplete` + `.rowIncomplete:hover` |
| `src/features/entry-list/__tests__/EntryRow.test.tsx` | Add 4 tests (duplicate call, no-throw, class applied, class absent) |
| `src/features/entry-list/EntryTable.tsx` | Add `onDuplicate?` prop; add `isEntryIncomplete` helper; pass both to `EntryRow` |
| `src/features/entry-list/__tests__/EntryTable.test.tsx` | Add 1 test (onDuplicate threads through) |
| `src/pages/ErfassungPage.tsx` | Add `handleDuplicate`; pass `onDuplicate` to `EntryTable` |
| `src/pages/__tests__/ErfassungPage.test.tsx` | Add duplicate integration test |

---

## Task 1: EntryRow — props, CSS, wired button

**Files:**
- Modify: `src/features/entry-list/EntryRow.tsx`
- Modify: `src/features/entry-list/EntryRow.module.css`
- Test: `src/features/entry-list/__tests__/EntryRow.test.tsx`

- [ ] **Step 1: Write 4 failing tests**

Add to the bottom of `src/features/entry-list/__tests__/EntryRow.test.tsx` (after the existing `describe` block). Also add `fireEvent` to the import on line 1:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
```

Then append:

```typescript
describe('EntryRow — duplicate and incomplete', () => {
  it('calls onDuplicate with entry id when Duplizieren is clicked', () => {
    const onDuplicate = vi.fn()
    render(<EntryRow entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} onDuplicate={onDuplicate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplicate).toHaveBeenCalledWith('1')
  })

  it('does not throw when Duplizieren is clicked without onDuplicate prop', () => {
    render(<EntryRow entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))).not.toThrow()
  })

  it('applies rowIncomplete class when isIncomplete is true', () => {
    const { container } = render(
      <EntryRow entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} isIncomplete={true} />
    )
    expect(container.firstChild).toHaveClass('rowIncomplete')
  })

  it('does not apply rowIncomplete class when isIncomplete is false', () => {
    const { container } = render(
      <EntryRow entry={baseEntry} onEdit={vi.fn()} onDelete={vi.fn()} isIncomplete={false} />
    )
    expect(container.firstChild).not.toHaveClass('rowIncomplete')
  })
})
```

- [ ] **Step 2: Verify tests fail**

```bash
npx vitest run src/features/entry-list/__tests__/EntryRow.test.tsx
```

Expected: 4 new tests FAIL (onDuplicate not yet wired, rowIncomplete class not yet added).

- [ ] **Step 3: Update EntryRow.tsx**

Replace the `interface EntryRowProps` block and function signature (lines 16–22):

```typescript
interface EntryRowProps {
  entry: TimeEntry
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate?: (id: string) => void
  isIncomplete?: boolean
}

export default function EntryRow({ entry, onEdit, onDelete, onDuplicate, isIncomplete }: EntryRowProps) {
```

Replace the outer `<div className={styles.row}` (line 32):

```tsx
<div
  className={[styles.row, isIncomplete && styles.rowIncomplete].filter(Boolean).join(' ')}
  role="button"
  tabIndex={0}
  aria-label={`Eintrag bearbeiten: ${entry.client} – ${entry.description}`}
  onClick={() => onEdit(entry.id)}
  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(entry.id) } }}
>
```

Replace the Duplizieren button (line 91):

```tsx
<button className={styles.iconBtn} aria-label="Duplizieren" onClick={() => onDuplicate?.(entry.id)}><Plus size={14} /></button>
```

- [ ] **Step 4: Add CSS to EntryRow.module.css**

Append to the end of `src/features/entry-list/EntryRow.module.css`:

```css
.rowIncomplete { background: #fef2f2; }
.rowIncomplete:hover { background: #fde8e8; }
```

- [ ] **Step 5: Verify tests pass**

```bash
npx vitest run src/features/entry-list/__tests__/EntryRow.test.tsx
```

Expected: all 7 tests PASS (3 existing + 4 new).

- [ ] **Step 6: Commit**

```bash
git add src/features/entry-list/EntryRow.tsx src/features/entry-list/EntryRow.module.css src/features/entry-list/__tests__/EntryRow.test.tsx
git commit -m "feat(entry-row): add onDuplicate prop and isIncomplete highlight"
```

---

## Task 2: EntryTable — thread onDuplicate, compute isIncomplete

**Files:**
- Modify: `src/features/entry-list/EntryTable.tsx`
- Test: `src/features/entry-list/__tests__/EntryTable.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to the bottom of `src/features/entry-list/__tests__/EntryTable.test.tsx` (inside or after the existing `describe`). Also add `fireEvent` to the import:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
```

Append:

```typescript
  it('calls onDuplicate when the Duplizieren button is clicked', () => {
    const onDuplicate = vi.fn()
    render(
      <EntryTable
        entries={[makeEntry('1', '2026-05-10')]}
        onEdit={() => {}}
        onDelete={() => {}}
        onDuplicate={onDuplicate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplicate).toHaveBeenCalledWith('1')
  })
```

- [ ] **Step 2: Verify test fails**

```bash
npx vitest run src/features/entry-list/__tests__/EntryTable.test.tsx
```

Expected: new test FAILS (onDuplicate not wired yet).

- [ ] **Step 3: Update EntryTable.tsx**

Replace the entire file content:

```typescript
import { useUIStore } from '../../stores/ui'
import { durationMinutes } from '../../data/format'
import type { TimeEntry } from '../../types/entry'
import DayGroupHeader from './DayGroupHeader'
import EntryRow from './EntryRow'
import styles from './EntryTable.module.css'

interface EntryTableProps {
  entries: TimeEntry[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate?: (id: string) => void
}

function groupByDate(entries: TimeEntry[]): [string, TimeEntry[]][] {
  const map = new Map<string, TimeEntry[]>()
  for (const e of entries) {
    const arr = map.get(e.date) ?? []
    arr.push(e)
    map.set(e.date, arr)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

function isEntryIncomplete(e: TimeEntry): boolean {
  return !e.start || !e.end || !e.client || !e.orderNo || !e.account || !e.description
}

export default function EntryTable({ entries, onEdit, onDelete, onDuplicate }: EntryTableProps) {
  const { collapsedDays, toggleDay } = useUIStore()

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Noch keine Zeiten erfasst</p>
      </div>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className={styles.container}>
      {groups.map(([date, dayEntries]) => {
        const totalMins = dayEntries.reduce((s, e) => s + durationMinutes(e), 0)
        const isCollapsed = collapsedDays.includes(date)
        return (
          <div key={date}>
            <DayGroupHeader
              date={date}
              entryCount={dayEntries.length}
              totalMinutes={totalMins}
              isCollapsed={isCollapsed}
              onToggle={() => toggleDay(date)}
            />
            <div id={`day-${date}`} hidden={isCollapsed}>
              {dayEntries.map(e => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  isIncomplete={isEntryIncomplete(e)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npx vitest run src/features/entry-list/__tests__/EntryTable.test.tsx
```

Expected: all 3 tests PASS (2 existing + 1 new).

- [ ] **Step 5: Commit**

```bash
git add src/features/entry-list/EntryTable.tsx src/features/entry-list/__tests__/EntryTable.test.tsx
git commit -m "feat(entry-table): thread onDuplicate prop and compute isIncomplete per row"
```

---

## Task 3: ErfassungPage — handleDuplicate handler

**Files:**
- Modify: `src/pages/ErfassungPage.tsx`
- Test: `src/pages/__tests__/ErfassungPage.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to `src/pages/__tests__/ErfassungPage.test.tsx` after the existing `describe('delete with undo', ...)` block (before the `describe('CSV import...')` block):

```typescript
describe('duplicate entry', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('creates a copy with today's date and null times when Duplizieren is clicked', async () => {
    const today = new Date().toISOString().slice(0, 10)
    saveTimeEntry({
      date: today,
      start: '09:00', end: '10:00',
      client: 'Dupli Kunde', orderNo: 'DUP-1', account: 'Dev',
      task: 'Feature', description: 'Original entry',
    })
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))

    const allEntries = getTimeEntries()
    expect(allEntries).toHaveLength(2)
    const duped = allEntries[1]
    expect(duped.date).toBe(today)
    expect(duped.start).toBeNull()
    expect(duped.end).toBeNull()
    expect(duped.client).toBe('Dupli Kunde')
    expect(duped.orderNo).toBe('DUP-1')
    expect(duped.description).toBe('Original entry')
  })
})
```

- [ ] **Step 2: Verify test fails**

```bash
npx vitest run src/pages/__tests__/ErfassungPage.test.tsx
```

Expected: new test FAILS (handleDuplicate not implemented yet).

- [ ] **Step 3: Add handleDuplicate to ErfassungPage.tsx**

Find `function handleDelete(id: string)` in `src/pages/ErfassungPage.tsx` and add `handleDuplicate` immediately before it:

```typescript
function handleDuplicate(id: string) {
  const entry = entries.find(e => e.id === id)
  if (!entry) return
  saveTimeEntry({
    client: entry.client,
    orderNo: entry.orderNo,
    account: entry.account,
    task: entry.task,
    description: entry.description,
    externalId: entry.externalId,
    jira: entry.jira,
    pr: entry.pr,
    date: new Date().toISOString().slice(0, 10),
    start: null,
    end: null,
  })
  setEntries(getTimeEntries())
}
```

- [ ] **Step 4: Pass onDuplicate to EntryTable**

Find the `<EntryTable` JSX in `src/pages/ErfassungPage.tsx` (currently around line 279):

```tsx
<EntryTable
  entries={filtered}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

Replace with:

```tsx
<EntryTable
  entries={filtered}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
/>
```

- [ ] **Step 5: Verify all tests pass**

```bash
npx vitest run
```

Expected: all tests PASS (205+ tests, 0 failures).

- [ ] **Step 6: Commit**

```bash
git add src/pages/ErfassungPage.tsx src/pages/__tests__/ErfassungPage.test.tsx
git commit -m "feat(erfassung): implement duplicate entry handler"
```
