import type { JiraIssueType } from '../types/entry'
import { JIRA_ISSUE_TYPES } from '../types/entry'
import styles from './IssueTypeSelector.module.css'

interface Props {
  value: JiraIssueType | '' | undefined
  onChange: (v: JiraIssueType | undefined) => void
  name?: string
}

export default function IssueTypeSelector({ value, onChange, name = 'jiraIssueType' }: Props) {
  return (
    <div className={styles.row}>
      {JIRA_ISSUE_TYPES.map(type => (
        <label key={type} className={styles.label}>
          <input
            type="radio"
            name={name}
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
            onClick={() => { if (value === type) onChange(undefined) }}
          />
          {type}
        </label>
      ))}
    </div>
  )
}
