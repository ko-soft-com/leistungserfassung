import { useEffect, useState } from 'react'
import { getDayRecord, saveDayRecord } from '../../services/firestoreDayRecords'
import { fmtH } from '../../data/format'
import type { DayRecord } from '../../types/dayRecord'
import styles from './DayPresenceRow.module.css'

interface DayPresenceRowProps {
  date: string
  bookedMinutes: number
}

function computeActualMinutes(record: DayRecord): number {
  if (!record.workStart || !record.workEnd) return 0
  const [sh, sm] = record.workStart.split(':').map(Number)
  const [eh, em] = record.workEnd.split(':').map(Number)
  let diff = eh * 60 + em - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60
  return Math.max(0, diff - record.pauseMinutes)
}

export default function DayPresenceRow({ date, bookedMinutes }: DayPresenceRowProps) {
  const [record, setRecord] = useState<DayRecord>({ date, pauseMinutes: 0 })

  useEffect(() => {
    getDayRecord(date).then(existing => {
      if (existing) setRecord(existing)
    }).catch(console.error)
  }, [date])

  async function update(changes: Partial<Omit<DayRecord, 'date'>>) {
    const next = { ...record, ...changes }
    setRecord(next)
    const { date: _date, ...rest } = next
    saveDayRecord(date, rest).catch(console.error)
  }

  const actualMinutes = computeActualMinutes(record)
  const unbookedMinutes = Math.max(0, actualMinutes - bookedMinutes)
  const greenPct = actualMinutes > 0
    ? Math.min(100, (bookedMinutes / actualMinutes) * 100)
    : 0
  const redPct = actualMinutes > 0
    ? Math.max(0, (unbookedMinutes / actualMinutes) * 100)
    : 0

  return (
    <div className={styles.row}>
      <div className={styles.inputs}>
        <label className={styles.label} htmlFor={`ps-${date}`}>von</label>
        <input
          id={`ps-${date}`}
          type="time"
          className={styles.timeInput}
          value={record.workStart ?? ''}
          onChange={e => update({ workStart: e.target.value || undefined })}
        />
        <span className={styles.sep} aria-hidden="true">→</span>
        <label className={styles.label} htmlFor={`pe-${date}`}>bis</label>
        <input
          id={`pe-${date}`}
          type="time"
          className={styles.timeInput}
          value={record.workEnd ?? ''}
          onChange={e => update({ workEnd: e.target.value || undefined })}
        />
        <label className={styles.label} htmlFor={`pp-${date}`}>Pause</label>
        <input
          id={`pp-${date}`}
          type="number"
          min="0"
          className={styles.pauseInput}
          value={record.pauseMinutes === 0 ? '' : record.pauseMinutes}
          onChange={e => update({ pauseMinutes: Number(e.target.value) || 0 })}
        />
        <span className={styles.label}>min</span>
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
