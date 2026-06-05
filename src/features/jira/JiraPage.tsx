import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../components/Button'
import JiraRow from './JiraRow'
import { getJiraTickets, saveJiraTicket, updateJiraTicket, deleteJiraTicket } from '../../services/firestoreJiraTickets'
import { getTimeEntries } from '../../services/firestoreTimeEntries'
import type { JiraTicket, JiraStatus } from '../../types/jiraTicket'
import { JIRA_STATUSES } from '../../types/jiraTicket'
import type { TimeEntry } from '../../types/entry'
import styles from './JiraPage.module.css'
import { useToastStore } from '../../stores/toast'

export default function JiraPage() {
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const addToast = useToastStore(s => s.addToast)

  const [nummer, setNummer] = useState('')
  const [titel, setTitel] = useState('')
  const [status, setStatus] = useState<JiraStatus>('Offen')
  const [kommentar, setKommentar] = useState('')
  const [nummerError, setNummerError] = useState('')
  const [titelError, setTitelError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getJiraTickets(), getTimeEntries()]).then(([t, e]) => {
      setTickets(t)
      setTimeEntries(e)
      setIsLoading(false)
    }).catch(() => {
      setLoadError('Tickets konnten nicht geladen werden.')
      setIsLoading(false)
    })
  }, [])

  function resetForm() {
    setEditingId(null)
    setNummer('')
    setTitel('')
    setStatus('Offen')
    setKommentar('')
    setNummerError('')
    setTitelError('')
  }

  async function handleSubmit() {
    let valid = true
    if (!nummer.trim()) { setNummerError('Nummer ist erforderlich'); valid = false } else setNummerError('')
    if (!titel.trim()) { setTitelError('Titel ist erforderlich'); valid = false } else setTitelError('')
    if (!valid) return
    try {
      if (editingId) {
        await updateJiraTicket(editingId, { nummer: nummer.trim(), titel: titel.trim(), status, kommentar })
        const now = new Date().toISOString()
        setTickets(prev =>
          prev.map(t => t.id === editingId ? { ...t, nummer: nummer.trim(), titel: titel.trim(), status, kommentar, updatedAt: now } : t)
        )
      } else {
        const saved = await saveJiraTicket({ nummer: nummer.trim(), titel: titel.trim(), status, kommentar })
        setTickets(prev => [saved, ...prev])
      }
      resetForm()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
    }
  }

  function handleEdit(ticket: JiraTicket) {
    setEditingId(ticket.id)
    setNummer(ticket.nummer)
    setTitel(ticket.titel)
    setStatus(ticket.status)
    setKommentar(ticket.kommentar)
  }

  async function handleDelete(id: string) {
    try {
      await deleteJiraTicket(id)
      setTickets(prev => prev.filter(t => t.id !== id))
    } catch {
      addToast('error', 'Fehler beim Löschen. Bitte erneut versuchen.')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <h1 className={styles.h1}>Jira-Tickets</h1>
        <p className={styles.subtitle}>{tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formField}>
          <label htmlFor="jira-nummer" className={styles.formLabel}>Nummer *</label>
          <input
            id="jira-nummer"
            aria-label="Nummer"
            className={[styles.formInput, styles.formInputMono, nummerError ? styles.error : ''].filter(Boolean).join(' ')}
            value={nummer}
            onChange={e => setNummer(e.target.value)}
            placeholder="AP-123"
            style={{ minWidth: 100, maxWidth: 120 }}
          />
          {nummerError && <span className={styles.errorText}>{nummerError}</span>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="jira-titel" className={styles.formLabel}>Titel *</label>
          <input
            id="jira-titel"
            aria-label="Titel"
            className={[styles.formInput, titelError ? styles.error : ''].filter(Boolean).join(' ')}
            value={titel}
            onChange={e => setTitel(e.target.value)}
            placeholder="Kurzbeschreibung"
          />
          {titelError && <span className={styles.errorText}>{titelError}</span>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="jira-status" className={styles.formLabel}>Status</label>
          <select
            id="jira-status"
            className={styles.formSelect}
            value={status}
            onChange={e => setStatus(e.target.value as JiraStatus)}
          >
            {JIRA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="jira-kommentar" className={styles.formLabel}>Kommentar</label>
          <input
            id="jira-kommentar"
            className={styles.formInput}
            value={kommentar}
            onChange={e => setKommentar(e.target.value)}
            placeholder="Optional"
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
          <span>Nummer</span>
          <span>Titel</span>
          <span>Status</span>
          <span>Kommentar</span>
          <span>Aktionen</span>
        </div>
        {isLoading && <p className={styles.loading}>Laden…</p>}
        {loadError && <p role="alert" className={styles.loadError}>{loadError}</p>}
        {!isLoading && !loadError && tickets.length === 0 && (
          <p className={styles.empty}>Noch keine Tickets vorhanden.</p>
        )}
        {tickets.map(ticket => (
          <JiraRow
            key={ticket.id}
            ticket={ticket}
            timeEntries={timeEntries}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </main>
  )
}
