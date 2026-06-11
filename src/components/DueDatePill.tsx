import { fmtDateDE } from '../data/format'
import styles from './DueDatePill.module.css'

interface DueDatePillProps {
  date: string | null
}

function isOverdue(date: string): boolean {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return date < todayStr
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
