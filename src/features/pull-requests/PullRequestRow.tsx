import { useState } from 'react'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { PullRequest, PrStatus } from '../../types/pullRequest'
import type { TimeEntry } from '../../types/entry'
import { durationMinutes, fmtH, fmtDateDE } from '../../data/format'
import styles from './PullRequestRow.module.css'

const STATUS_CLASS: Record<PrStatus, string> = {
  'Draft':  styles.statusDraft,
  'Open':   styles.statusOpen,
  'Merged': styles.statusMerged,
  'Closed': styles.statusClosed,
}

interface PullRequestRowProps {
  pr: PullRequest
  timeEntries: TimeEntry[]
  onEdit: (pr: PullRequest) => void
  onDelete: (id: string) => void
}

export default function PullRequestRow({ pr, timeEntries, onEdit, onDelete }: PullRequestRowProps) {
  const [expanded, setExpanded] = useState(false)

  const matched = timeEntries.filter(e =>
    e.pr && pr.name.toLowerCase().includes(e.pr.toLowerCase())
  )
  const totalMins = matched.reduce((sum, e) => sum + durationMinutes(e), 0)
  const panelId = `pr-row-${pr.id}`

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.name}>{pr.name}</span>
        <span className={[styles.statusPill, STATUS_CLASS[pr.status]].join(' ')}>
          {pr.status}
        </span>
        <span className={styles.kommentar}>{pr.kommentar}</span>
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
            onClick={() => onEdit(pr)}
            aria-label="Bearbeiten"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onDelete(pr.id)}
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
