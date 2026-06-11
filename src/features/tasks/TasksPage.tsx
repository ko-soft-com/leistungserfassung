import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../components/Button'
import TaskRow from './TaskRow'
import { getTasks, saveTask, updateTask, deleteTask } from '../../services/firestoreTasks'
import { getJiraTickets } from '../../services/firestoreJiraTickets'
import { getPullRequests } from '../../services/firestorePullRequests'
import type { Task, TaskStatus, TaskHistoryEntry } from '../../types/task'
import { TASK_STATUSES } from '../../types/task'
import type { JiraTicket } from '../../types/jiraTicket'
import type { PullRequest } from '../../types/pullRequest'
import { useToastStore } from '../../stores/toast'
import styles from './TasksPage.module.css'

function toISO(timeStr: string): string | null {
  if (!timeStr) return null
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return new Date(`${yyyy}-${mm}-${dd}T${timeStr}:00`).toISOString()
}

function fromISO(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([])
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const addToast = useToastStore(s => s.addToast)

  const [titel, setTitel] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Geplant')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [jiraTicketId, setJiraTicketId] = useState('')
  const [pullRequestId, setPullRequestId] = useState('')
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('')
  const [titelError, setTitelError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<TaskStatus>('Geplant')

  useEffect(() => {
    Promise.all([getTasks(), getJiraTickets(), getPullRequests()]).then(([t, j, p]) => {
      setTasks(t)
      setJiraTickets(j)
      setPullRequests(p)
      setIsLoading(false)
    }).catch(() => {
      setLoadError('Aufgaben konnten nicht geladen werden.')
      setIsLoading(false)
    })
  }, [])

  function resetForm() {
    setEditingId(null)
    setTitel('')
    setBeschreibung('')
    setStatus('Geplant')
    setStartTime('')
    setEndTime('')
    setJiraTicketId('')
    setPullRequestId('')
    setFaelligkeitsdatum('')
    setTitelError('')
    setOriginalStatus('Geplant')
  }

  async function handleSubmit() {
    if (!titel.trim()) { setTitelError('Titel ist erforderlich'); return }
    setTitelError('')
    try {
      const startedAt = toISO(startTime)
      const endedAt = toISO(endTime)
      if (editingId) {
        const existing = tasks.find(t => t.id === editingId)
        const existingHistory: TaskHistoryEntry[] = existing?.history ?? []
        const newEntries: TaskHistoryEntry[] = status !== originalStatus
          ? [{ timestamp: new Date().toISOString(), von: originalStatus, nach: status }]
          : []
        const history = [...existingHistory, ...newEntries]
        await updateTask(editingId, {
          titel: titel.trim(), beschreibung, status, startedAt, endedAt,
          jiraTicketId: jiraTicketId || null,
          pullRequestId: pullRequestId || null,
          faelligkeitsdatum: faelligkeitsdatum.trim() || null,
          history,
        })
        const now = new Date().toISOString()
        setTasks(prev => prev.map(t => t.id === editingId
          ? { ...t, titel: titel.trim(), beschreibung, status, startedAt, endedAt, jiraTicketId: jiraTicketId || null, pullRequestId: pullRequestId || null, faelligkeitsdatum: faelligkeitsdatum.trim() || null, history, updatedAt: now }
          : t
        ))
      } else {
        const saved = await saveTask({
          titel: titel.trim(), beschreibung, status, startedAt, endedAt,
          jiraTicketId: jiraTicketId || null,
          pullRequestId: pullRequestId || null,
          faelligkeitsdatum: faelligkeitsdatum.trim() || null,
          history: [],
        })
        setTasks(prev => [saved, ...prev])
      }
      resetForm()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
    }
  }

  function handleEdit(task: Task) {
    setEditingId(task.id)
    setTitel(task.titel)
    setBeschreibung(task.beschreibung)
    setStatus(task.status)
    setOriginalStatus(task.status)
    setStartTime(fromISO(task.startedAt))
    setEndTime(fromISO(task.endedAt))
    setJiraTicketId(task.jiraTicketId ?? '')
    setPullRequestId(task.pullRequestId ?? '')
    setFaelligkeitsdatum(task.faelligkeitsdatum ?? '')
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      addToast('error', 'Fehler beim Löschen. Bitte erneut versuchen.')
    }
  }

  async function handleQuickStart(id: string) {
    try {
      const existing = tasks.find(t => t.id === id)
      if (!existing) return
      if (existing.startedAt) return
      const now = new Date().toISOString()
      const newEntries: TaskHistoryEntry[] = existing.status !== 'In Arbeit'
        ? [{ timestamp: now, von: existing.status, nach: 'In Arbeit' }]
        : []
      const history = [...(existing.history ?? []), ...newEntries]
      await updateTask(id, { startedAt: now, status: 'In Arbeit', history })
      setTasks(prev => prev.map(t => t.id === id
        ? { ...t, startedAt: now, status: 'In Arbeit', history, updatedAt: now }
        : t
      ))
    } catch {
      addToast('error', 'Fehler beim Starten. Bitte erneut versuchen.')
    }
  }

  async function handleQuickStop(id: string) {
    try {
      const existing = tasks.find(t => t.id === id)
      if (!existing) return
      if (existing.endedAt) return
      const now = new Date().toISOString()
      const newEntries: TaskHistoryEntry[] = existing.status !== 'Fertig'
        ? [{ timestamp: now, von: existing.status, nach: 'Fertig' }]
        : []
      const history = [...(existing.history ?? []), ...newEntries]
      await updateTask(id, { endedAt: now, status: 'Fertig', history })
      setTasks(prev => prev.map(t => t.id === id
        ? { ...t, endedAt: now, status: 'Fertig', history, updatedAt: now }
        : t
      ))
    } catch {
      addToast('error', 'Fehler beim Stoppen. Bitte erneut versuchen.')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <h1 className={styles.h1}>Aufgaben</h1>
        <p className={styles.subtitle}>{tasks.length} {tasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formField}>
          <label htmlFor="task-titel" className={styles.formLabel}>Titel *</label>
          <input
            id="task-titel"
            aria-label="Titel"
            className={[styles.formInput, titelError ? styles.error : ''].filter(Boolean).join(' ')}
            value={titel}
            onChange={e => setTitel(e.target.value)}
            placeholder="Kurzbeschreibung"
            style={{ minWidth: 200 }}
          />
          {titelError && <span className={styles.errorText}>{titelError}</span>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-status" className={styles.formLabel}>Status</label>
          <select
            id="task-status"
            className={styles.formSelect}
            value={status}
            onChange={e => setStatus(e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-start" className={styles.formLabel}>Start</label>
          <div className={styles.timeRow}>
            <input
              id="task-start"
              type="time"
              className={styles.formInput}
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
            <button type="button" className={styles.nowBtn} onClick={() => setStartTime(new Date().toTimeString().slice(0, 5))}>
              Jetzt
            </button>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-end" className={styles.formLabel}>Ende</label>
          <div className={styles.timeRow}>
            <input
              id="task-end"
              type="time"
              className={styles.formInput}
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
            <button type="button" className={styles.nowBtn} onClick={() => setEndTime(new Date().toTimeString().slice(0, 5))}>
              Jetzt
            </button>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-jira" className={styles.formLabel}>Jira-Ticket</label>
          <select
            id="task-jira"
            className={styles.formSelect}
            value={jiraTicketId}
            onChange={e => setJiraTicketId(e.target.value)}
          >
            <option value="">Kein Ticket</option>
            {jiraTickets.map(j => (
              <option key={j.id} value={j.id}>{j.nummer} · {j.status} · {j.titel}</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-pr" className={styles.formLabel}>Pull Request</label>
          <select
            id="task-pr"
            className={styles.formSelect}
            value={pullRequestId}
            onChange={e => setPullRequestId(e.target.value)}
          >
            <option value="">Kein PR</option>
            {pullRequests.map(p => (
              <option key={p.id} value={p.id}>#{p.nummer} · {p.status} · {p.titel}</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-beschreibung" className={styles.formLabel}>Beschreibung</label>
          <textarea
            id="task-beschreibung"
            className={styles.formInput}
            value={beschreibung}
            onChange={e => setBeschreibung(e.target.value)}
            placeholder="Optional"
            rows={2}
            style={{ resize: 'vertical', minWidth: 200, fontFamily: 'var(--font-sans)', fontSize: 13 }}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="task-faelligkeitsdatum" className={styles.formLabel}>Fälligkeit</label>
          <input
            id="task-faelligkeitsdatum"
            type="date"
            value={faelligkeitsdatum}
            onChange={e => setFaelligkeitsdatum(e.target.value)}
            className={styles.formInput}
          />
        </div>

        <Button variant="primary" onClick={handleSubmit} aria-label="Speichern">
          <Plus size={14} /> {editingId ? 'Aktualisieren' : 'Speichern'}
        </Button>

        {editingId && (
          <>
            <span className={styles.editingBadge}>Bearbeitungsmodus</span>
            <Button variant="ghost" onClick={resetForm} aria-label="Abbrechen">
              <X size={14} /> Abbrechen
            </Button>
          </>
        )}
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Titel</span>
          <span>Status</span>
          <span>Zeitraum</span>
          <span>Jira</span>
          <span>PR</span>
          <span>Fälligkeit</span>
          <span>Aktionen</span>
        </div>
        {isLoading && <p className={styles.loading}>Laden…</p>}
        {loadError && <p role="alert" className={styles.loadError}>{loadError}</p>}
        {!isLoading && !loadError && tasks.length === 0 && (
          <p className={styles.empty}>Noch keine Aufgaben vorhanden.</p>
        )}
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            jiraTickets={jiraTickets}
            pullRequests={pullRequests}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onQuickStart={handleQuickStart}
            onQuickStop={handleQuickStop}
          />
        ))}
      </div>
    </main>
  )
}
