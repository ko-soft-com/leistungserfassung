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
  const keyCounterRef = useRef(0)
  const [segments, setSegments] = useState<Array<WorkSegment & { _key: number }>>(() => {
    const segs = initialSegments(initialRecord)
    return segs.map(s => ({ ...s, _key: keyCounterRef.current++ }))
  })
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  function scheduleSave(segs: Array<WorkSegment & { _key: number }>) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const clean = segs.map(({ _key: _, ...s }) => s)
      saveDayRecord(date, { segments: clean })
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
    const newSeg = { start: last?.end ?? '', end: '', _key: keyCounterRef.current++ }
    const next = [...segments, newSeg]
    setSegments(next)
    scheduleSave(next)
  }

  function removeSegment(index: number) {
    const next = segments.filter((_, i) => i !== index)
    const safe = next.length > 0 ? next : [{ start: '', end: '', _key: keyCounterRef.current++ }]
    setSegments(safe)
    scheduleSave(safe)
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
          <div key={seg._key}>
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
                  value={pauseDisplay === null ? '' : String(pauseDisplay)}
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
        <button type="button" className={styles.addBtn} aria-label="Segment hinzufügen" onClick={addSegment}>
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
