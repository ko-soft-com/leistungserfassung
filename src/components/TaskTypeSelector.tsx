import type { TaskType } from '../types/entry'
import { TASK_TYPES } from '../types/entry'
import styles from './TaskTypeSelector.module.css'

interface Props {
  value: TaskType
  onChange: (v: TaskType) => void
  name?: string
}

export default function TaskTypeSelector({ value, onChange, name = 'taskType' }: Props) {
  return (
    <div className={styles.row}>
      {TASK_TYPES.map(type => (
        <label key={type} className={[styles.label, value === type ? styles.selected : ''].join(' ')} data-task={type}>
          <input
            type="radio"
            name={name}
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
            aria-label={type}
          />
          {type}
        </label>
      ))}
    </div>
  )
}
