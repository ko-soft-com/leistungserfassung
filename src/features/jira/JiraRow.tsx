import { useState } from 'react'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { JiraTicket, JiraStatus } from '../../types/jiraTicket'
import type { TimeEntry } from '../../types/entry'
import { durationMinutes, fmtH, fmtDateDE } from '../../data/format'
import styles from './JiraRow.module.css'

const STATUS_CLASS: Record<JiraStatus, string> = {
  'Offen':          styles.statusOffen,
  'In Progress':    styles.statusInProgress,
  'In Code Review': styles.statusInCodeReview,
  'Done':           styles.statusDone,
}

interface JiraRowProps {
  ticket: JiraTicket
  timeEntries: TimeEntry[]
  onEdit: (ticket: JiraTicket) => void
  onDelete: (id: string) => void
}

export default function JiraRow({ ticket, timeEntries, onEdit, onDelete }: JiraRowProps) {
  const [expanded, setExpanded] = useState(false)

  const matched = timeEntries.filter(e =>
    e.jira && ticket.name.toLowerCase().includes(e.jira.toLowerCase())
  )
  const totalMins = matched.reduce((sum, e) => sum + durationMinutes(e), 0)
  const panelId = `jira-row-${ticket.id}`

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.name}>{ticket.name}</span>
        <span className={[styles.statusPill, STATUS_CLASS[ticket.status]].join(' ')}>
          {ticket.status}
        </span>
        <span className={styles.kommentar}>{ticket.kommentar}</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setExpanded(e => !e)}
            aria-label="Buchungen anzeigen"
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            <ChevronDown
              size={14}
              className={[styles.chevron, expanded ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
            />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onEdit(ticket)}
            aria-label="Bearbeiten"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onDelete(ticket.id)}
            aria-label="Löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div id={panelId} className={styles.expanded}>
          {matched.length === 0 ? (
            <p className={styles.noEntries}>Keine Buchungen gefunden</p>
          ) : (
            <>
              <p className={styles.totalLine}>Gesamt: {fmtH(totalMins)}</p>
              {matched.map(e => (
                <div key={e.id} className={styles.entryLine}>
                  <span>{fmtDateDE(e.date)}</span>
                  <span>{fmtH(durationMinutes(e))}</span>
                  <span>{e.description}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
