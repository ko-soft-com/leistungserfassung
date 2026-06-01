# Multi-Segment Presence Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single workStart/workEnd/pauseMinutes day presence model with a dynamic list of work segments, with auto-calculated breaks and per-gap manual overrides.

**Architecture:** `DayRecord` gains a `segments: WorkSegment[]` field. Migration from old format happens on read in the Firestore service layer. `DayPresenceRow` is rewritten to render a dynamic segment list with add/remove buttons and inter-segment pause fields.

**Tech Stack:** React, TypeScript, Vitest + Testing Library, Firebase Firestore, CSS Modules, Lucide icons

---

### Task 1: Update DayRecord types

**Files:**
- Modify: `src/types/dayRecord.ts`

- [ ] **Step 1: Replace the file contents**

```ts
export interface WorkSegment {
  start: string
  end: string
  pauseOverride?: number  // minutes — overrides calculated gap before this segment
}

export interface DayRecord {
  date: string
  segments: WorkSegment[]
  // Legacy fields — kept for migration detection only, never written on save
  workStart?: string
  workEnd?: string
  pauseMinutes?: number
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors only in files that pass old-format `DayRecord` without `segments` — these will be fixed in Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/types/dayRecord.ts
git commit -m "feat(types): add WorkSegment and segments[] to DayRecord"
```

---

### Task 2: Add migrateDayRecord and update Firestore reads

**Files:**
- Modify: `src/services/firestoreDayRecords.ts`
- Modify: `src/services/firestoreDayRecords.test.ts`

- [ ] **Step 1: Write failing tests for migrateDayRecord**

Replace the full contents of `src/services/firestoreDayRecords.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { DayRecord } from '../types/dayRecord'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
}))

vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
}))

import { getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import {
  getAllDayRecords,
  saveDayRecord,
  getDayRecord,
  migrateDayRecord,
} from './firestoreDayRecords'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('migrateDayRecord', () => {
  it('returns new-format record unchanged when segments array present', () => {
    const raw = { date: '2026-06-01', segments: [{ start: '08:00', end: '12:00' }] }
    expect(migrateDayRecord(raw)).toEqual({
      date: '2026-06-01',
      segments: [{ start: '08:00', end: '12:00' }],
    })
  })

  it('converts legacy workStart/workEnd to single segment', () => {
    const raw = { date: '2026-06-01', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 }
    expect(migrateDayRecord(raw)).toEqual({
      date: '2026-06-01',
      segments: [{ start: '08:00', end: '17:00' }],
    })
  })

  it('drops legacy workStart/workEnd/pauseMinutes fields after migration', () => {
    const raw = { date: '2026-06-01', workStart: '09:00', workEnd: '18:00', pauseMinutes: 60 }
    const result = migrateDayRecord(raw)
    expect(result.workStart).toBeUndefined()
    expect(result.workEnd).toBeUndefined()
    expect(result.pauseMinutes).toBeUndefined()
  })

  it('returns empty segments when no time data present', () => {
    const raw = { date: '2026-06-01' }
    expect(migrateDayRecord(raw)).toEqual({ date: '2026-06-01', segments: [] })
  })

  it('returns empty segments when only workStart is set (no workEnd)', () => {
    const raw = { date: '2026-06-01', workStart: '08:00' }
    expect(migrateDayRecord(raw)).toEqual({ date: '2026-06-01', segments: [] })
  })
})

describe('getAllDayRecords', () => {
  it('returns empty object when collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any)
    const result = await getAllDayRecords()
    expect(result).toEqual({})
  })

  it('migrates legacy record on read and keys by date', async () => {
    const raw = { date: '2026-05-22', workStart: '08:00', workEnd: '17:00', pauseMinutes: 30 }
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ id: '2026-05-22', data: () => raw }],
    } as any)
    const result = await getAllDayRecords()
    expect(result['2026-05-22'].segments).toEqual([{ start: '08:00', end: '17:00' }])
    expect(result['2026-05-22'].workStart).toBeUndefined()
  })

  it('returns multiple records keyed by date', async () => {
    const r1 = { date: '2026-05-20', segments: [{ start: '09:00', end: '17:00' }] }
    const r2 = { date: '2026-05-22', segments: [{ start: '08:00', end: '16:00' }] }
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        { id: '2026-05-20', data: () => r1 },
        { id: '2026-05-22', data: () => r2 },
      ],
    } as any)
    const result = await getAllDayRecords()
    expect(Object.keys(result)).toHaveLength(2)
    expect(result['2026-05-20'].segments[0].start).toBe('09:00')
  })
})

describe('saveDayRecord', () => {
  it('calls setDoc with segments payload', async () => {
    vi.mocked(doc).mockReturnValueOnce('mock-ref' as any)
    vi.mocked(setDoc).mockResolvedValueOnce(undefined)
    const data = { segments: [{ start: '08:00', end: '17:00' }] }
    const result = await saveDayRecord('2026-05-22', data)
    expect(setDoc).toHaveBeenCalledWith('mock-ref', { date: '2026-05-22', ...data })
    expect(result.date).toBe('2026-05-22')
    expect(result.segments).toEqual([{ start: '08:00', end: '17:00' }])
  })
})

describe('getDayRecord', () => {
  it('returns null when document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result).toBeNull()
  })

  it('migrates legacy record on read', async () => {
    const raw = { workStart: '09:00', workEnd: '18:00', pauseMinutes: 45 }
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => raw,
    } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result?.segments).toEqual([{ start: '09:00', end: '18:00' }])
    expect(result?.pauseMinutes).toBeUndefined()
  })

  it('returns new-format record unchanged', async () => {
    const record: DayRecord = {
      date: '2026-05-22',
      segments: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    }
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => record,
    } as any)
    const result = await getDayRecord('2026-05-22')
    expect(result?.segments).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
npx vitest run src/services/firestoreDayRecords.test.ts
```

Expected: failures on `migrateDayRecord` (not exported yet) and updated getAllDayRecords/getDayRecord tests.

- [ ] **Step 3: Implement migrateDayRecord and update Firestore reads**

Replace the full contents of `src/services/firestoreDayRecords.ts`:

```ts
import { collection, getDocs, setDoc, getDoc, doc } from 'firebase/firestore'
import { db, auth } from './firebase'
import type { DayRecord, WorkSegment } from '../types/dayRecord'

function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Nicht authentifiziert')
  return uid
}

function tagesDoc(uid: string, date: string) {
  return doc(db, 'users', uid, 'tageszeiten', date)
}

export function migrateDayRecord(raw: Record<string, unknown>): DayRecord {
  const date = raw.date as string
  if (Array.isArray(raw.segments)) {
    return { date, segments: raw.segments as WorkSegment[] }
  }
  const segments: WorkSegment[] = []
  if (raw.workStart && raw.workEnd) {
    segments.push({ start: raw.workStart as string, end: raw.workEnd as string })
  }
  return { date, segments }
}

export async function getAllDayRecords(): Promise<Record<string, DayRecord>> {
  const uid = requireUid()
  const snapshot = await getDocs(collection(db, 'users', uid, 'tageszeiten'))
  const result: Record<string, DayRecord> = {}
  for (const d of snapshot.docs) {
    result[d.id] = migrateDayRecord({ ...d.data(), date: d.id })
  }
  return result
}

export async function saveDayRecord(
  date: string,
  data: Omit<DayRecord, 'date'>,
): Promise<DayRecord> {
  const uid = requireUid()
  const record: DayRecord = { date, ...data }
  await setDoc(tagesDoc(uid, date), record)
  return record
}

export async function getDayRecord(date: string): Promise<DayRecord | null> {
  const uid = requireUid()
  const snap = await getDoc(tagesDoc(uid, date))
  if (!snap.exists()) return null
  return migrateDayRecord({ ...snap.data(), date })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/services/firestoreDayRecords.test.ts
```

Expected: all tests green.

- [ ] **Step 5: Run full suite to check for regressions**

```bash
npm test
```

Expected: TypeScript errors gone in this file; any remaining errors are in DayPresenceRow (fixed in Task 3).

- [ ] **Step 6: Commit**

```bash
git add src/services/firestoreDayRecords.ts src/services/firestoreDayRecords.test.ts
git commit -m "feat(service): add migrateDayRecord, apply on all Firestore day record reads"
```

---

### Task 3: Rewrite DayPresenceRow component and styles

**Files:**
- Modify: `src/features/entry-list/DayPresenceRow.tsx`
- Modify: `src/features/entry-list/DayPresenceRow.module.css`
- Modify: `src/features/entry-list/__tests__/DayPresenceRow.test.tsx`

- [ ] **Step 1: Write failing tests**

Replace the full contents of `src/features/entry-list/__tests__/DayPresenceRow.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DayPresenceRow from '../DayPresenceRow'

vi.mock('../../../services/firestoreDayRecords', () => ({
  saveDayRecord: vi.fn((date: string, data: any) => Promise.resolve({ date, ...data })),
}))

import { saveDayRecord } from '../../../services/firestoreDayRecords'

describe('DayPresenceRow', () => {
  it('renders a single segment row with von/bis inputs by default', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    expect(screen.getAllByLabelText('von')).toHaveLength(1)
    expect(screen.getAllByLabelText('bis')).toHaveLength(1)
  })

  it('shows no bar and no "gebucht" text when segment times are empty', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={90} />)
    expect(screen.queryByText(/gebucht/)).not.toBeInTheDocument()
  })

  it('shows actual time and bar when segment has start and end', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={90} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText('2:00h akt.')).toBeInTheDocument()
    expect(screen.getByText(/gebucht/)).toBeInTheDocument()
  })

  it('shows "offen" when booked < actual', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={60} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.getByText(/1:00h offen/)).toBeInTheDocument()
  })

  it('does not show "offen" when booked >= actual', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={120} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '10:00' } })
    expect(screen.queryByText(/offen/)).not.toBeInTheDocument()
  })

  it('adds a second segment when "+ Segment" is clicked', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    expect(screen.getAllByLabelText('von')).toHaveLength(2)
    expect(screen.getAllByLabelText('bis')).toHaveLength(2)
  })

  it('pre-fills new segment start from previous segment end', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    expect(vonInputs[1].value).toBe('12:00')
  })

  it('shows pause field between two segments', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('auto-calculates pause from gap between segments', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs[1], { target: { value: '13:00' } })
    expect((screen.getByLabelText('Pause') as HTMLInputElement).value).toBe('60')
  })

  it('uses pauseOverride when set instead of auto-calculated gap', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('bis'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs[1], { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Pause'), { target: { value: '30' } })
    // Span: 08:00-not-set to 13:00 — actual time should reflect override
    // Two segments: seg0 end=12:00, seg1 start=13:00, override=30
    // span = 13:00 - seg0.start (empty) → 0 until seg0.start is set
    const bisInputs = screen.getAllByLabelText('bis') as HTMLInputElement[]
    fireEvent.change(bisInputs[1], { target: { value: '17:00' } })
    const vonInputs2 = screen.getAllByLabelText('von') as HTMLInputElement[]
    fireEvent.change(vonInputs2[0], { target: { value: '08:00' } })
    // span = 17:00 - 08:00 = 9h; break override = 30min; actual = 8:30h
    expect(screen.getByText('8:30h akt.')).toBeInTheDocument()
  })

  it('removes a segment when × is clicked', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.click(screen.getByRole('button', { name: /Segment/i }))
    expect(screen.getAllByLabelText('von')).toHaveLength(2)
    const removeButtons = screen.getAllByRole('button', { name: /entfernen/i })
    fireEvent.click(removeButtons[0])
    expect(screen.getAllByLabelText('von')).toHaveLength(1)
  })

  it('hides remove button when only one empty segment remains', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    expect(screen.queryByRole('button', { name: /entfernen/i })).not.toBeInTheDocument()
  })

  it('shows remove button when single segment has a value', () => {
    render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
    fireEvent.change(screen.getByLabelText('von'), { target: { value: '08:00' } })
    expect(screen.getByRole('button', { name: /entfernen/i })).toBeInTheDocument()
  })

  it('persists segments to Firestore after debounce', async () => {
    vi.useFakeTimers()
    try {
      render(<DayPresenceRow date="2026-06-01" bookedMinutes={0} />)
      fireEvent.change(screen.getByLabelText('von'), { target: { value: '09:00' } })
      await vi.runAllTimersAsync()
      expect(vi.mocked(saveDayRecord)).toHaveBeenCalledWith(
        '2026-06-01',
        expect.objectContaining({ segments: expect.arrayContaining([expect.objectContaining({ start: '09:00' })]) })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders pre-loaded segments from initialRecord', () => {
    render(
      <DayPresenceRow
        date="2026-06-01"
        bookedMinutes={0}
        initialRecord={{
          date: '2026-06-01',
          segments: [
            { start: '07:30', end: '12:00' },
            { start: '13:00', end: '16:30' },
          ],
        }}
      />
    )
    const vonInputs = screen.getAllByLabelText('von') as HTMLInputElement[]
    const bisInputs = screen.getAllByLabelText('bis') as HTMLInputElement[]
    expect(vonInputs[0].value).toBe('07:30')
    expect(bisInputs[0].value).toBe('12:00')
    expect(vonInputs[1].value).toBe('13:00')
    expect(bisInputs[1].value).toBe('16:30')
  })

  it('computes actual minutes across multiple segments with pause override', () => {
    render(
      <DayPresenceRow
        date="2026-06-01"
        bookedMinutes={0}
        initialRecord={{
          date: '2026-06-01',
          segments: [
            { start: '08:00', end: '12:00' },
            { start: '13:00', end: '17:00', pauseOverride: 45 },
          ],
        }}
      />
    )
    // span = 17:00 - 08:00 = 9h; break override = 45min; actual = 8:15h
    expect(screen.getByText('8:15h akt.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/entry-list/__tests__/DayPresenceRow.test.tsx
```

Expected: most tests fail (old component has different UI).

- [ ] **Step 3: Rewrite DayPresenceRow.tsx**

Replace the full contents of `src/features/entry-list/DayPresenceRow.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { saveDayRecord } from '../../services/firestoreDayRecords'
import { fmtH } from '../../data/format'
import type { DayRecord, WorkSegment } from '../../types/dayRecord'
import styles from './DayPresenceRow.module.css'

interface DayPresenceRowProps {
  date: string
  bookedMinutes: number
  initialRecord?: DayRecord | null
  onSaved?: (record: DayRecord) => void
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function computeActualMinutes(segments: WorkSegment[]): number {
  if (segments.length === 0) return 0
  const first = segments[0]
  const last = segments[segments.length - 1]
  if (!first.start || !last.end) return 0
  const span = Math.max(0, timeToMinutes(last.end) - timeToMinutes(first.start))
  let totalBreak = 0
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const curr = segments[i]
    if (curr.pauseOverride !== undefined) {
      totalBreak += curr.pauseOverride
    } else if (prev.end && curr.start) {
      totalBreak += Math.max(0, timeToMinutes(curr.start) - timeToMinutes(prev.end))
    }
  }
  return Math.max(0, span - totalBreak)
}

function initialSegments(record: DayRecord | null | undefined): WorkSegment[] {
  if (!record) return [{ start: '', end: '' }]
  if (record.segments && record.segments.length > 0) return record.segments
  if (record.workStart && record.workEnd) {
    return [{ start: record.workStart, end: record.workEnd }]
  }
  return [{ start: '', end: '' }]
}

export default function DayPresenceRow({ date, bookedMinutes, initialRecord, onSaved }: DayPresenceRowProps) {
  const [segments, setSegments] = useState<WorkSegment[]>(() => initialSegments(initialRecord))
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  function scheduleSave(segs: WorkSegment[]) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveDayRecord(date, { segments: segs })
        .then(saved => onSaved?.(saved))
        .catch(console.error)
    }, 500)
  }

  function updateSegment(index: number, changes: Partial<WorkSegment>) {
    const next = segments.map((s, i) => i === index ? { ...s, ...changes } : s)
    setSegments(next)
    scheduleSave(next)
  }

  function addSegment() {
    const last = segments[segments.length - 1]
    const newSeg: WorkSegment = { start: last?.end ?? '', end: '' }
    const next = [...segments, newSeg]
    setSegments(next)
    scheduleSave(next)
  }

  function removeSegment(index: number) {
    const next = segments.filter((_, i) => i !== index)
    setSegments(next)
    scheduleSave(next)
  }

  const actualMinutes = computeActualMinutes(segments)
  const unbookedMinutes = Math.max(0, actualMinutes - bookedMinutes)
  const greenPct = actualMinutes > 0 ? Math.min(100, (bookedMinutes / actualMinutes) * 100) : 0
  const redPct = actualMinutes > 0 ? Math.max(0, (unbookedMinutes / actualMinutes) * 100) : 0

  const singleEmpty = segments.length === 1 && !segments[0].start && !segments[0].end

  return (
    <div className={styles.row}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        const nextSeg = segments[i + 1]
        const autoGap =
          !isLast && seg.end && nextSeg?.start
            ? Math.max(0, timeToMinutes(nextSeg.start) - timeToMinutes(seg.end))
            : 0
        const pauseDisplay =
          !isLast
            ? nextSeg?.pauseOverride !== undefined
              ? nextSeg.pauseOverride
              : autoGap
            : null

        return (
          <div key={i}>
            <div className={styles.inputs}>
              <label className={styles.label} htmlFor={`ps-${date}-${i}`}>von</label>
              <input
                id={`ps-${date}-${i}`}
                type="time"
                className={styles.timeInput}
                value={seg.start}
                onChange={e => updateSegment(i, { start: e.target.value })}
              />
              <span className={styles.sep} aria-hidden="true">→</span>
              <label className={styles.label} htmlFor={`pe-${date}-${i}`}>bis</label>
              <input
                id={`pe-${date}-${i}`}
                type="time"
                className={styles.timeInput}
                value={seg.end}
                onChange={e => updateSegment(i, { end: e.target.value })}
              />
              {!singleEmpty && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  aria-label={`Segment ${i + 1} entfernen`}
                  onClick={() => removeSegment(i)}
                >
                  <X size={11} />
                </button>
              )}
            </div>
            {!isLast && (
              <div className={styles.pauseRow}>
                <label className={styles.label} htmlFor={`pp-${date}-${i}`}>Pause</label>
                <input
                  id={`pp-${date}-${i}`}
                  type="number"
                  min="0"
                  className={styles.pauseInput}
                  value={pauseDisplay === 0 ? '' : String(pauseDisplay ?? '')}
                  onChange={e => {
                    const val = e.target.value
                    updateSegment(i + 1, { pauseOverride: val === '' ? undefined : Number(val) })
                  }}
                />
                <span className={styles.label}>min</span>
              </div>
            )}
          </div>
        )
      })}

      <div className={styles.addRow}>
        <button type="button" className={styles.addBtn} onClick={addSegment}>
          <Plus size={11} /> Segment
        </button>
        {actualMinutes > 0 && (
          <span className={styles.actual}>{fmtH(actualMinutes)} akt.</span>
        )}
      </div>

      {actualMinutes > 0 && (
        <div className={styles.barRow}>
          <div className={styles.track}>
            <div className={styles.green} style={{ width: `${greenPct}%` }} />
            <div className={styles.red} style={{ width: `${redPct}%` }} />
          </div>
          <span className={styles.caption}>
            {fmtH(bookedMinutes)} gebucht
            {unbookedMinutes > 0 && ` · ${fmtH(unbookedMinutes)} offen`}
          </span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update DayPresenceRow.module.css**

Replace the full contents of `src/features/entry-list/DayPresenceRow.module.css`:

```css
.row {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-soft);
  padding: 6px 16px 8px 16px;
}

.inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pauseRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0 3px 16px;
}

.addRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.label {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-sans);
}

.timeInput {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 5px;
  width: 82px;
  outline: none;
}
.timeInput:focus { border-color: var(--accent); }

.pauseInput {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 5px;
  width: 48px;
  outline: none;
}
.pauseInput:focus { border-color: var(--accent); }

.sep { font-size: 12px; color: var(--muted); }

.removeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 2px;
  border-radius: var(--radius-sm);
  line-height: 1;
}
.removeBtn:hover { color: var(--danger); }

.addBtn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-sans);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  line-height: 1.4;
}
.addBtn:hover { color: var(--accent); border-color: var(--accent); }

.actual {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--accent-text);
}

.barRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
}

.track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  display: flex;
  overflow: hidden;
}

.green {
  height: 100%;
  background: var(--accent);
  transition: width 0.2s;
}

.red {
  height: 100%;
  background: var(--danger);
  transition: width 0.2s;
}

.caption {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}
```

- [ ] **Step 5: Run DayPresenceRow tests**

```bash
npx vitest run src/features/entry-list/__tests__/DayPresenceRow.test.tsx
```

Expected: all tests green.

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass. If TypeScript errors remain, check that files importing `DayRecord` construct the `segments` field.

- [ ] **Step 7: Commit**

```bash
git add src/features/entry-list/DayPresenceRow.tsx \
        src/features/entry-list/DayPresenceRow.module.css \
        src/features/entry-list/__tests__/DayPresenceRow.test.tsx
git commit -m "feat(ui): rewrite DayPresenceRow with dynamic multi-segment support"
```

---

### Task 4: Verify in running app

- [ ] **Step 1: Start the app**

```bash
npm run dev
```

Open Electron or browser at the local dev URL shown in the terminal.

- [ ] **Step 2: Verify existing day records load correctly**

Open the app and navigate to a day that already has a presence record. Confirm:
- The old `workStart`/`workEnd` data migrated to a single segment row
- The segment shows the correct start and end times
- The presence bar still renders correctly

- [ ] **Step 3: Verify multi-segment entry**

For today's date:
1. Enter `08:00` → `12:00` in the first segment
2. Click `+ Segment` — confirm a second row appears with `von` pre-filled as `12:00`
3. Change second row to `13:00` → `17:00` — confirm Pause field shows `60 min`
4. Edit Pause to `30` — confirm actual time updates to `8:30h akt.`
5. Clear Pause field — confirm actual time returns to auto-calculated value
6. Click `×` on first segment — confirm it is removed and single row remains
7. Reload the app — confirm the saved segments persist

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(ui): <describe fix>"
```
