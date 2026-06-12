import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/Button'
import { saveTask } from '../../services/firestoreTasks'
import { getJiraTickets } from '../../services/firestoreJiraTickets'
import { getPullRequests } from '../../services/firestorePullRequests'
import { useRefreshStore } from '../../stores/refresh'
import { useToastStore } from '../../stores/toast'
import type { TaskStatus } from '../../types/task'
import { TASK_STATUSES } from '../../types/task'
import type { JiraTicket } from '../../types/jiraTicket'
import type { PullRequest } from '../../types/pullRequest'
import styles from './QuickAddTaskModal.module.css'

function toISO(timeStr: string): string | null {
  if (!timeStr) return null
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return new Date(`${yyyy}-${mm}-${dd}T${timeStr}:00`).toISOString()
}

interface Props { onClose: () => void }

export default function QuickAddTaskModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Geplant')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [jiraTicketId, setJiraTicketId] = useState('')
  const [pullRequestId, setPullRequestId] = useState('')
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('')
  const [titelError, setTitelError] = useState('')
  const [saving, setSaving] = useState(false)
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([])
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])

  const incrementTask = useRefreshStore(s => s.incrementTask)
  const addToast      = useToastStore(s => s.addToast)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    const handleClose = () => onCloseRef.current()
    dialog?.addEventListener('close', handleClose)
    Promise.all([getJiraTickets(), getPullRequests()]).then(([j, p]) => {
      setJiraTickets(j)
      setPullRequests(p)
    })
    return () => dialog?.removeEventListener('close', handleClose)
  }, [])

  function close() { dialogRef.current?.close() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titel.trim()) { setTitelError('Titel ist erforderlich'); return }
    setTitelError('')
    setSaving(true)
    try {
      await saveTask({
        titel: titel.trim(), beschreibung, status,
        startedAt: toISO(startTime), endedAt: toISO(endTime),
        jiraTicketId: jiraTicketId || null,
        pullRequestId: pullRequestId || null,
        faelligkeitsdatum: faelligkeitsdatum.trim() || null,
      })
      incrementTask()
      addToast('success', 'Aufgabe gespeichert.')
      close()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.header}>
        <span className={styles.title}>Neue Aufgabe</span>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Schließen">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-titel">Titel *</label>
          <input id="qa-task-titel" className={styles.input} value={titel} onChange={e => setTitel(e.target.value)} />
          {titelError && <span className={styles.error}>{titelError}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-status">Status</label>
          <select id="qa-task-status" className={styles.select} value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="qa-task-start">Von</label>
            <input id="qa-task-start" type="time" className={styles.input} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="qa-task-end">Bis</label>
            <input id="qa-task-end" type="time" className={styles.input} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-jira">Jira-Ticket</label>
          <select id="qa-task-jira" className={styles.select} value={jiraTicketId} onChange={e => setJiraTicketId(e.target.value)}>
            <option value="">– keines –</option>
            {jiraTickets.map(t => <option key={t.id} value={t.id}>{t.nummer} — {t.titel}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-pr">Pull Request</label>
          <select id="qa-task-pr" className={styles.select} value={pullRequestId} onChange={e => setPullRequestId(e.target.value)}>
            <option value="">– keines –</option>
            {pullRequests.map(p => <option key={p.id} value={p.id}>#{p.nummer} — {p.titel}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-faellig">Fälligkeit</label>
          <input id="qa-task-faellig" type="date" className={styles.input} value={faelligkeitsdatum} onChange={e => setFaelligkeitsdatum(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-task-beschreibung">Beschreibung</label>
          <textarea id="qa-task-beschreibung" className={styles.textarea} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} />
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={close}>Abbrechen</Button>
          <Button variant="primary" type="submit" disabled={saving}>Speichern</Button>
        </div>
      </form>
    </dialog>
  )
}
