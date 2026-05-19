# Gleitzeit Presence Bar — Design Spec

## Overview

Per-day presence tracking for flextime users. The user records arrival, departure, and total pause time for each day. The app computes actual worked time and shows a green/red bar comparing booked time entries against actual time. No validation — pure calculation only.

---

## Data Model

New type in `src/types/dayRecord.ts`:

```typescript
export interface DayRecord {
  date: string          // 'YYYY-MM-DD'
  workStart?: string    // 'HH:MM' — arrival time
  workEnd?: string      // 'HH:MM' — departure time
  pauseMinutes: number  // total pause in minutes, default 0
}
```

**Derived value (never stored):**
```
rawMinutes    = workEnd - workStart   (using HH:MM arithmetic, wraps midnight)
actualMinutes = max(0, rawMinutes - pauseMinutes)
```
If `workStart` or `workEnd` is missing, `actualMinutes = 0` (bar not shown).
If `workEnd < workStart` (overnight) the wrap is handled the same as `durationMinutes` in `format.ts` (add 24×60 when diff < 0).

---

## Storage

New file `src/services/dayRecords.ts`:

```typescript
const DAY_RECORDS_KEY = 'day-records'

export function getDayRecord(date: string): DayRecord | null
export function saveDayRecord(date: string, data: Omit<DayRecord, 'date'>): DayRecord
```

Data stored as `Record<string, DayRecord>` — a date-keyed map in a single localStorage entry.

---

## Components

### `DayPresenceRow`

New component: `src/features/entry-list/DayPresenceRow.tsx`

Props:
```typescript
interface DayPresenceRowProps {
  date: string
  bookedMinutes: number
}
```

Internal state: `record: DayRecord` (loaded from `getDayRecord(date)`, initialized to `{ date, pauseMinutes: 0 }` if absent).

Layout — two lines below the `DayGroupHeader`:

**Line 1 — inputs:**
```
[08:00] → [17:15]   Pause [45] min   =  8:30h akt.
```
- Start input: `type="time"`, label "von"
- End input: `type="time"`, label "bis"
- Pause input: `type="number"` (minutes), label "Pause"
- Computed actual time displayed as `fmtH(actualMinutes)` + " akt."
- All three fields save on `onChange` via `saveDayRecord`

**Line 2 — progress bar:**
```
████████████████░░░░   7:30h gebucht · 1:00h offen
```
- Only shown when `actualMinutes > 0`
- Green segment width: `min(bookedMinutes, actualMinutes) / actualMinutes * 100%`
- Red segment width: `max(0, actualMinutes - bookedMinutes) / actualMinutes * 100%`
- If `bookedMinutes >= actualMinutes`: bar is fully green, no red
- Caption: `{fmtH(bookedMinutes)} gebucht · {fmtH(max(0, actualMinutes - bookedMinutes))} offen`
- No bar, no caption shown when `actualMinutes === 0`

---

## Integration

`EntryTable.tsx` renders `DayPresenceRow` between `DayGroupHeader` and the entry rows for each date group:

```tsx
<DayGroupHeader ... />
<DayPresenceRow date={date} bookedMinutes={totalMins} />
<div id={`day-${date}`} hidden={isCollapsed}>
  {dayEntries.map(...)}
</div>
```

`DayPresenceRow` is always rendered (not toggled by collapse). The presence inputs remain accessible even when entries are collapsed.

---

## No Validation

- No error if `workEnd < workStart`
- No error if `bookedMinutes > actualMinutes`
- No required fields — all presence inputs are optional
- Pause input accepts any non-negative integer
- Pure display: whatever is entered is calculated and shown

---

## Files

| File | Action |
|------|--------|
| `src/types/dayRecord.ts` | Create — `DayRecord` interface |
| `src/services/dayRecords.ts` | Create — `getDayRecord`, `saveDayRecord` |
| `src/features/entry-list/DayPresenceRow.tsx` | Create — presence inputs + progress bar |
| `src/features/entry-list/DayPresenceRow.module.css` | Create — layout and bar styles |
| `src/features/entry-list/EntryTable.tsx` | Modify — render `DayPresenceRow` per day group |

---

## Out of Scope

- No weekly aggregation of presence hours
- No export of presence data
- No integration with the Überstunden KPI (stays week-based on booked time)
- No automatic population from time entries' start/end times
