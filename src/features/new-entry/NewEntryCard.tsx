import { Plus, Play, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { useDraft } from './useDraft'
import { getLastUsed, setLastUsed } from './suggestions'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { saveTimeEntry } from '../../services/storage'
import type { TaskType, TimeEntry } from '../../types/entry'
import styles from './NewEntryCard.module.css'

interface NewEntryCardProps {
  onSaved?: (entry: TimeEntry) => void
}

export default function NewEntryCard({ onSaved }: NewEntryCardProps = {}) {
  const { draft, setField, errors, validate, reset } = useDraft()
  const lastUsed = getLastUsed()

  function handleSave() {
    if (!validate()) return
    const saved = saveTimeEntry({
      date: draft.date,
      start: draft.start,
      end: draft.end || null,
      client: draft.client,
      orderNo: draft.orderNo,
      account: draft.account,
      task: draft.task,
      description: draft.description,
      jira: draft.jira || undefined,
      pr: draft.pr || undefined,
    })
    setLastUsed({ client: draft.client, orderNo: draft.orderNo, account: draft.account })
    onSaved?.(saved)
    reset()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') reset()
  }

  const durationStr = (() => {
    if (!draft.start || !draft.end || draft.end <= draft.start) return ''
    const [sh, sm] = draft.start.split(':').map(Number)
    const [eh, em] = draft.end.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}h`
  })()

  return (
    <div className={styles.card} onKeyDown={handleKeyDown}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Plus size={15} color="var(--accent)" />
          <span className={styles.title}>Neuer Eintrag</span>
          <span className={styles.subtitle}>· {format(new Date(), 'dd.MM.yyyy')}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.caption}>Stoppuhr</span>
          <button className={styles.startPill} type="button">
            <Play size={11} /> Start
          </button>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSave() }}>
        <div className={styles.row1}>
          <Field
            label="Auftraggeber" required
            value={draft.client}
            onChange={v => setField('client', v)}
            error={errors.client}
            suggestion={lastUsed.client ? 'letzte' : undefined}
          />
          <Field
            label="Auftragsnr." required
            value={draft.orderNo}
            onChange={v => setField('orderNo', v)}
            error={errors.orderNo}
            suggestion={lastUsed.orderNo ? 'letzte' : undefined}
          />
          <Field
            label="Zeitkonto" required
            value={draft.account}
            onChange={v => setField('account', v)}
            error={errors.account}
            suggestion={lastUsed.account ? 'letzte' : undefined}
          />
          <div className={styles.taskSelect}>
            <label className={styles.taskLabel} htmlFor="task-select">Aufgabe</label>
            <select
              id="task-select"
              className={styles.taskInput}
              value={draft.task}
              onChange={e => setField('task', e.target.value as TaskType)}
            >
              <option value="Feature">Feature</option>
              <option value="Bug-Fixing">Bug-Fixing</option>
              <option value="Review">Review</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>
          <Field label="Start" mono value={draft.start} onChange={v => setField('start', v)} error={errors.start} />
          <Field label="Ende" mono value={draft.end} onChange={v => setField('end', v)} error={errors.end} />
          <Field label="Dauer" mono readOnly value={durationStr} onChange={() => {}} />
        </div>

        <div className={styles.row2}>
          <Field label="Beschreibung" multiline rows={2} value={draft.description} onChange={v => setField('description', v)} error={errors.description} />
          <Field label="JIRA-Ticket" mono value={draft.jira} onChange={v => setField('jira', v)} />
          <Field label="Pull-Request" mono value={draft.pr} onChange={v => setField('pr', v)} />
          <div className={styles.actions}>
            <Button variant="ghost" type="button" onClick={reset}><X size={13} /> Abbrechen</Button>
            <Button variant="primary" type="submit"><Check size={13} /> Speichern</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
