import type { ReactNode } from 'react'
import styles from './Pill.module.css'

export type TaskType = 'Bug-Fixing' | 'Feature' | 'Review' | 'Meeting'

type PillVariant = 'task' | 'jira' | 'pr' | 'meta'

interface PillProps {
  variant: PillVariant
  taskType?: TaskType
  children: ReactNode
}

const taskStyleMap: Record<TaskType, string> = {
  'Bug-Fixing': styles.bug,
  'Feature': styles.feat,
  'Review': styles.rev,
  'Meeting': styles.meet,
}

export default function Pill({ variant, taskType, children }: PillProps) {
  const cls = [
    styles.pill,
    variant === 'task' && taskType ? taskStyleMap[taskType] : styles[variant],
  ].filter(Boolean).join(' ')
  return <span className={cls}>{children}</span>
}
