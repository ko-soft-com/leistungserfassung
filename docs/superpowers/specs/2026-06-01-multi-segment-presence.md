# Spec: Multi-Segment Presence Tracking

**Date:** 2026-06-01  
**Status:** Approved  
**Branch target:** development

## Overview

Replace the single `workStart`/`workEnd`/`pauseMinutes` presence model in `DayRecord` with a dynamic list of work segments. Breaks are automatically calculated from the gaps between segments and are manually overridable per gap. Old data is migrated on read.

---

## Data Model

### New type: `WorkSegment`

```ts
export interface WorkSegment {
  start: string           // 'HH:MM'
  end: string             // 'HH:MM'
  pauseOverride?: number  // minutes — overrides the calculated gap BEFORE this segment
}
```

### Updated type: `DayRecord`

```ts
export interface DayRecord {
  date: string
  segments: WorkSegment[]
  // Legacy fields — kept for migration detection only, not written on save
  workStart?: string
  workEnd?: string
  pauseMinutes?: number
}
```

`pauseOverride` on segment[0] is meaningless (no preceding gap) and must never be set.

---

## Break Calculation

### Calculated gap between two segments

```
gapMinutes(seg[i], seg[i+1]) = seg[i+1].start - seg[i].end
```

If `seg[i+1].pauseOverride` is set, it replaces the calculated gap for purposes of actual-time computation.

### Actual worked minutes

```
actualMinutes = (lastSeg.end - firstSeg.start) - totalBreakMinutes
totalBreakMinutes = sum over i of (seg[i+1].pauseOverride ?? gapMinutes(seg[i], seg[i+1]))
```

Where `firstSeg.start` and `lastSeg.end` are the overall span endpoints. This preserves the existing paradigm (`workEnd - workStart - pauseMinutes`).

---

## Migration

Performed **on read**, in memory only — no Firestore write triggered on migration.

```
if raw.segments exists → use as-is (new format)
else if raw.workStart && raw.workEnd exist → create single segment { start: workStart, end: workEnd }
  note: old pauseMinutes is dropped (no gap exists in a single-segment day)
else → segments: []
```

On the next user-triggered save, the new `segments` format is persisted. Legacy fields (`workStart`, `workEnd`, `pauseMinutes`) are not written.

---

## UI: `DayPresenceRow`

### Layout

```
von [08:00] bis [12:00]  [×]
    Pause: [60] min          ← auto-calculated, editable
von [13:00] bis [17:00]  [×]
    Pause: [15] min
von [17:15] bis [18:00]  [×]
                         [+ Segment]

9:00h Präsenz · 8:45h akt. · 7:30h gebucht  ████████░░
```

### Behaviour

- **Initial state:** If `segments` is empty, one empty segment row is shown (no auto-fill).
- **„+ Segment":** Appends a new segment with `start` pre-filled from the previous segment's `end` (if set), `end` empty.
- **„×" (remove):** Removes the segment. The button is hidden when only one segment remains and that segment has no values (avoids leaving zero rows).
- **Pause field:** Rendered between consecutive segment rows (N segments → N−1 pause fields). Auto-filled from the calculated gap. Editing sets `pauseOverride`. Clearing the field resets `pauseOverride` to `undefined`, restoring the automatic calculation.
- **Save:** Debounced 500 ms after any change (existing pattern). Segments with empty `start` or `end` are persisted as-is (partial entry allowed).
- **Presence bar:** Unchanged — continues to use `actualMinutes` vs `bookedMinutes`.

---

## Persistence

### Firestore

`saveDayRecord(date, rest)` API is unchanged. The `rest` payload now contains `segments[]` instead of `workStart`/`workEnd`/`pauseMinutes`. No Firestore Security Rules changes required.

Migration happens in `getAllDayRecords()` and `getDayRecord()` when reading raw Firestore documents.

### JSON Backup

`exportToJson` writes `dayRecords` as-is — new `segments` field is included automatically. `importFromJson` restores `dayRecords` as-is; `migrateDayRecord` runs on any old-format entries. Old backups remain importable.

### CSV

DayRecords are not part of CSV export/import — no changes needed.

---

## Affected Files

| File | Change |
|---|---|
| `src/types/dayRecord.ts` | Add `WorkSegment`, update `DayRecord` with `segments[]`, keep legacy fields as optional |
| `src/services/firestoreDayRecords.ts` | Add `migrateDayRecord()`, apply in `getAllDayRecords()` and any single-record fetch |
| `src/features/entry-list/DayPresenceRow.tsx` | Replace single-window UI with dynamic segment list |
| `src/features/entry-list/DayPresenceRow.module.css` | Add styles for segment list, pause row, add/remove buttons |
| `src/features/entry-list/__tests__/DayPresenceRow.test.tsx` | Update tests for new UI and segment logic |
| `src/services/firestoreDayRecords.test.ts` | Tests for `migrateDayRecord` covering all migration paths |

---

## Out of Scope

- Deriving presence segments from existing `TimeEntry` start/end values (Option B/C from brainstorming — not selected)
- Firestore data cleanup of legacy fields in existing documents
- Changes to CSV export/import
- Changes to KPI calculations or global overtime tracking
