import { useState } from 'react'
import { Pencil, Trash2, Play, Square, ChevronDown } from 'lucide-react'
import type { Task, TaskStatus } from '../../types/task'
import type { JiraTicket } from '../../types/jiraTicket'
import type { PullRequest } from '../../types/pullRequest'
import { fmtTimestampDE } from '../../data/format'
import styles from './TaskRow.module.css'

const STATUS_CLASS: Record<TaskStatus, string> = {
  'Geplant':   styles.statusGeplant,
  'In Arbeit': styles.statusInArbeit,
  'Fertig':    styles.statusFertig,
}

interface TaskRowProps {
  task: Task
  jiraTickets: JiraTicket[]
  pullRequests: PullRequest[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onQuickStart: (id: string) => void
  onQuickStop: (id: string) => void
}

function fmtTime(iso: string | null): string {
  if (!iso) return '–'
  return iso.slice(11, 16)
}

export default function TaskRow({ task, jiraTickets, pullRequests, onEdit, onDelete, onQuickStart, onQuickStop }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const panelId = `task-row-${task.id}`
  const sortedHistory = [...(task.history ?? [])].reverse()
  const linkedJira = jiraTickets.find(j => j.id === task.jiraTicketId)
  const linkedPr = pullRequests.find(p => p.id === task.pullRequestId)

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.titel}>{task.titel}</span>
        <span className={[styles.statusPill, STATUS_CLASS[task.status]].join(' ')}>
          {task.status}
        </span>
        <span className={styles.zeitraum}>{fmtTime(task.startedAt)} → {fmtTime(task.endedAt)}</span>
        <span className={styles.linkPill}>{linkedJira ? linkedJira.nummer : ''}</span>
        <span className={styles.linkPill}>{linkedPr ? `#${linkedPr.nummer}` : ''}</span>
        <div className={styles.actions}>
          {!task.startedAt && (
            <button type="button" className={styles.iconBtn} onClick={() => onQuickStart(task.id)} aria-label="Starten">
              <Play size={14} />
            </button>
          )}
          {task.startedAt && !task.endedAt && (
            <button type="button" className={styles.iconBtn} onClick={() => onQuickStop(task.id)} aria-label="Stoppen">
              <Square size={14} />
            </button>
          )}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setExpanded(e => !e)}
            aria-label="Verlauf anzeigen"
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            <ChevronDown size={14} className={[styles.chevron, expanded ? styles.chevronOpen : ''].filter(Boolean).join(' ')} />
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => onEdit(task)} aria-label="Bearbeiten">
            <Pencil size={14} />
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => onDelete(task.id)} aria-label="Löschen">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div id={panelId} className={styles.expanded}>
          {task.beschreibung && <p className={styles.beschreibung}>{task.beschreibung}</p>}
          <p className={styles.historySectionTitle}>Statusverlauf</p>
          {sortedHistory.length === 0 ? (
            <p className={styles.noEntries}>Noch keine Statusänderungen</p>
          ) : (
            sortedHistory.map(entry => (
              <div key={entry.timestamp} className={styles.historyLine}>
                <span className={styles.historyTimestamp}>{fmtTimestampDE(entry.timestamp)}</span>
                <span>{entry.von} → {entry.nach}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
