import { Pencil, Plus, Trash2, MoreHorizontal } from 'lucide-react'
import type { TimeEntry } from '../../types/entry'
import { durationMinutes, fmtH, fmtDateDE } from '../../data/format'
import Pill from '../../components/Pill'
import styles from './EntryRow.module.css'

const CLIENT_COLORS = ['#16a34a','#1d4ed8','#b91c1c','#7e22ce','#0e7490','#c05621','#065f46','#1e40af']

function clientColor(client: string): string {
  let hash = 0
  for (let i = 0; i < client.length; i++) hash = (hash * 31 + client.charCodeAt(i)) >>> 0
  return CLIENT_COLORS[hash % CLIENT_COLORS.length]
}

interface EntryRowProps {
  entry: TimeEntry
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const mins = durationMinutes(entry)
  const timeStr = `${entry.start} – ${entry.end ?? '…'}`
  const dateShort = fmtDateDE(entry.date).slice(0, 5) // DD.MM

  const hasRefs = entry.jira || entry.pr || entry.externalId

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      aria-label={`Eintrag bearbeiten: ${entry.client} – ${entry.description}`}
      onClick={() => onEdit(entry.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(entry.id) } }}
    >
      {/* Col 1: tree anchor */}
      <div className={styles.anchor} />

      {/* Col 2: time stack */}
      <div className={styles.timeStack}>
        <span className={styles.timeStr}>{timeStr}</span>
        <span className={styles.dateShort}>{dateShort}</span>
        <Pill variant="task" taskType={entry.task}>{entry.task}</Pill>
      </div>

      {/* Col 3: main stack */}
      <div className={styles.mainStack}>
        <div data-line="1" className={styles.auftragHeader}>
          <span className={styles.clientDot} style={{ background: clientColor(entry.client) }} />
          <span className={styles.client}>{entry.client}</span>
          <span className={styles.sep}>·</span>
          <span className={styles.mono}>{entry.orderNo}</span>
          <span className={styles.sep}>·</span>
          <span className={styles.mono}>{entry.account}</span>
        </div>
        <div data-line="2" className={styles.description}>{entry.description}</div>
        <div data-line="3" className={styles.refs}>
          {hasRefs ? (
            <>
              {entry.jira && <span className={styles.jiraRef}>{entry.jira}</span>}
              {entry.pr && <span className={styles.prRef}>#{entry.pr}</span>}
              {entry.externalId && <span className={styles.extRef}>Ext: {entry.externalId}</span>}
            </>
          ) : (
            <span className={styles.noRefs}>keine Referenzen</span>
          )}
        </div>
      </div>

      {/* Col 4: duration */}
      <div className={styles.duration}>
        <span className={styles.durationNum}>{fmtH(mins)}</span>
        <span className={styles.durationCaption}>Dauer</span>
      </div>

      {/* Col 5: actions */}
      <div className={styles.actions} onClick={e => e.stopPropagation()}>
        <button className={styles.iconBtn} aria-label="Bearbeiten" onClick={() => onEdit(entry.id)}><Pencil size={14} /></button>
        <button className={styles.iconBtn} aria-label="Duplizieren"><Plus size={14} /></button>
        <button className={styles.iconBtn} aria-label="Löschen" onClick={() => onDelete(entry.id)}><Trash2 size={14} /></button>
        <button className={styles.iconBtn} aria-label="Mehr"><MoreHorizontal size={14} /></button>
      </div>
    </div>
  )
}
