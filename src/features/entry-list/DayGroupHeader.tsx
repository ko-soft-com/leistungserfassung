import { ChevronDown } from 'lucide-react'
import { fmtH, fmtDayLabel } from '../../data/format'
import styles from './DayGroupHeader.module.css'

interface DayGroupHeaderProps {
  date: string
  entryCount: number
  totalMinutes: number
  isCollapsed: boolean
  onToggle: () => void
}

export default function DayGroupHeader({ date, entryCount, totalMinutes, isCollapsed, onToggle }: DayGroupHeaderProps) {
  const groupId = `day-${date}`
  return (
    <button
      className={styles.header}
      aria-expanded={!isCollapsed}
      aria-controls={groupId}
      onClick={onToggle}
      type="button"
    >
      <ChevronDown
        size={13}
        className={[styles.chevron, isCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
      />
      <span className={styles.dayLabel}>{fmtDayLabel(date)}</span>
      <span className={styles.count}>· {entryCount} {entryCount === 1 ? 'Eintrag' : 'Einträge'}</span>
      <span className={styles.total}>{fmtH(totalMinutes)}</span>
    </button>
  )
}
