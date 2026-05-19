# Duplicate Entry + Incomplete Row Highlight — Design Spec

## Overview

Two UI improvements to the time entry table:

1. **Duplizieren**: Wire the existing unused Plus button in `EntryRow` to duplicate an entry directly to today — no drawer, no time fields, immediate save.
2. **Rot-Highlight**: Rows with any empty/null mandatory field get a light red background to signal they need attention.

---

## Feature 1: Duplizieren

### Behaviour

Clicking the Plus button on an entry row:
- Creates a new `TimeEntry` copying all fields from the original **except**:
  - `date` → today (`new Date().toISOString().slice(0, 10)`)
  - `start` → `null`
  - `end` → `null`
- Saves immediately via `saveTimeEntry(...)` — no confirmation, no drawer
- Table refreshes to show the new entry

### Component Changes

**`EntryRow.tsx`**
- Add `onDuplicate?: (id: string) => void` to props
- Wire the existing `<button aria-label="Duplizieren">` to call `onDuplicate(entry.id)`

**`ErfassungPage.tsx`**
- Implement `handleDuplicate(id: string)`:
  ```typescript
  const entry = getTimeEntries().find(e => e.id === id)
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
  queryClient.invalidateQueries({ queryKey: ['entries'] })
  ```
- Pass `onDuplicate={handleDuplicate}` to each `<EntryRow>`

---

## Feature 2: Incomplete Row Highlight

### Definition of "Incomplete"

A row is **incomplete** if any of these fields is empty or null:
- `start` (null)
- `end` (null)
- `client` (`''`)
- `orderNo` (`''`)
- `account` (`''`)
- `description` (`''`)

### Component Changes

**`EntryRow.tsx`**
- Add `isIncomplete?: boolean` to props
- Apply `styles.rowIncomplete` class to the row element when `isIncomplete` is true (alongside existing `styles.row`)

**`EntryRow.module.css`**
- Add:
  ```css
  .rowIncomplete { background: #fef2f2; }
  .rowIncomplete:hover { background: #fde8e8; }
  ```

**`ErfassungPage.tsx`**
- Compute `isIncomplete` inline per entry:
  ```typescript
  const isIncomplete = !e.start || !e.end || !e.client || !e.orderNo || !e.account || !e.description
  ```
- Pass `isIncomplete={isIncomplete}` to each `<EntryRow>`

---

## Files Changed

| File | Action |
|------|--------|
| `src/features/entry-list/EntryRow.tsx` | Add `onDuplicate` + `isIncomplete` props, wire button, apply class |
| `src/features/entry-list/EntryRow.module.css` | Add `.rowIncomplete` styles |
| `src/pages/ErfassungPage.tsx` | Implement `handleDuplicate`, compute `isIncomplete`, pass both props |
| `src/features/entry-list/__tests__/EntryRow.test.tsx` | Tests for both new behaviours |
| `src/pages/__tests__/ErfassungPage.test.tsx` | Integration test for duplicate handler |

---

## Out of Scope

- No drawer/confirmation for duplicate
- No toast/undo for duplicate (direct save, no undo)
- No field-level highlighting within a row (row-level only)
- No changes to edit flow
