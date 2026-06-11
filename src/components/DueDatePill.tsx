import { localISO } from '../data/filter'
import { fmtDateDE } from '../data/format'
import styles from './DueDatePill.module.css'

interface DueDatePillProps {
  date: string | null
}

function isOverdue(date: string): boolean {
  return date < localISO(new Date())
}

export default function DueDatePill({ date }: DueDatePillProps) {
  if (!date) return null
  const overdue = isOverdue(date)
  return (
    <span className={[styles.pill, overdue ? styles.overdue : ''].filter(Boolean).join(' ')}>
      {fmtDateDE(date)}
    </span>
  )
}
