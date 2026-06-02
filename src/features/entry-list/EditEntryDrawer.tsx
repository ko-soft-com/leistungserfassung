import { useState } from 'react'
import { X, Check } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import type { TimeEntry } from '../../types/entry'
import { durationMinutes } from '../../data/format'
import Field from '../../components/Field'
import Button from '../../components/Button'
import IssueTypeSelector from '../../components/IssueTypeSelector'
import TaskTypeSelector from '../../components/TaskTypeSelector'
import styles from './EditEntryDrawer.module.css'

interface EditEntryDrawerProps {
  entry: TimeEntry
  onSave: (updated: TimeEntry) => void
  onClose: () => void
}

function fmtDuration(mins: number): string {
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

function parseDuration(str: string): number | null {
  if (!str.trim()) return null
  const colonParts = str.split(':')
  if (colonParts.length === 2) {
    const h = parseInt(colonParts[0], 10)
    const m = parseInt(colonParts[1], 10)
    if (!isNaN(h) && !isNaN(m) && m >= 0 && m < 60) return h * 60 + m
  }
  const n = parseFloat(str)
  if (!isNaN(n) && n > 0) return Math.round(n * 60)
  return null
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = ((h * 60 + m + mins) % (24 * 60) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = eh * 60 + em - (sh * 60 + sm)
  return diff < 0 ? diff + 24 * 60 : diff
}

export default function EditEntryDrawer({ entry, onSave, onClose }: EditEntryDrawerProps) {
  const [draft, setDraft] = useState({ ...entry })
  const [durationStr, setDurationStr] = useState(() => {
    const mins = durationMinutes(entry)
    return mins > 0 ? fmtDuration(mins) : ''
  })

  function setField<K extends keyof TimeEntry>(key: K, value: TimeEntry[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  function handleStartChange(v: string) {
    const newStart = v || null
    setField('start', newStart)
    if (newStart && draft.end) {
      setDurationStr(fmtDuration(diffMinutes(newStart, draft.end)))
    } else if (newStart && !draft.end) {
      const mins = parseDuration(durationStr)
      if (mins && mins > 0) setField('end', addMinutes(newStart, mins))
    }
  }

  function handleEndChange(v: string) {
    const newEnd = v || null
    setField('end', newEnd)
    if (draft.start && newEnd) {
      setDurationStr(fmtDuration(diffMinutes(draft.start, newEnd)))
    } else if (!draft.start && newEnd) {
      const mins = parseDuration(durationStr)
      if (mins && mins > 0) setField('start', addMinutes(newEnd, -mins))
    }
  }

  function handleDurationChange(v: string) {
    setDurationStr(v)
    const mins = parseDuration(v)
    if (!mins || mins <= 0) return
    if (draft.start) {
      setField('end', addMinutes(draft.start, mins))
    } else if (draft.end) {
      setField('start', addMinutes(draft.end, -mins))
    }
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.drawer}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>Eintrag bearbeiten</Dialog.Title>
            <Dialog.Close asChild>
              <button className={styles.closeBtn} aria-label="Schließen"><X size={16} /></button>
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            <Field id="edit-date" label="Datum" type="date" value={draft.date} onChange={v => setField('date', v)} />
            <Field id="edit-auftraggeber" label="Auftraggeber" required value={draft.client} onChange={v => setField('client', v)} />
            <Field id="edit-orderNo" label="Auftragsnr." required value={draft.orderNo} onChange={v => setField('orderNo', v)} />
            <Field id="edit-zeitkonto" label="Zeitkonto" required value={draft.account} onChange={v => setField('account', v)} />
            <div className={styles.timeRow}>
              <Field id="edit-start" label="Start" mono type="time" value={draft.start ?? ''} onChange={handleStartChange} />
              <Field id="edit-ende" label="Ende" mono type="time" value={draft.end ?? ''} onChange={handleEndChange} />
              <Field id="edit-dauer" label="Dauer" mono placeholder="H:MM" value={durationStr} onChange={handleDurationChange} />
            </div>
            <TaskTypeSelector value={draft.task} onChange={v => setField('task', v)} name="edit-task" />
            <Field id="edit-beschreibung" label="Beschreibung" multiline value={draft.description} onChange={v => setField('description', v)} />
            <div className={styles.refRow}>
              <Field id="edit-jira" label="JIRA-Ticket" mono value={draft.jira ?? ''} onChange={v => setField('jira', v || undefined)} />
              <Field id="edit-pr" label="Pull-Request" mono value={draft.pr ?? ''} onChange={v => setField('pr', v || undefined)} />
            </div>
            <IssueTypeSelector
              value={draft.jiraIssueType}
              onChange={v => setField('jiraIssueType', v)}
            />
          </div>

          <div className={styles.footer}>
            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button variant="primary" onClick={() => onSave(draft)}>
              <Check size={13} /> Speichern
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
