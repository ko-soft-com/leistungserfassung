import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../components/Button'
import PullRequestRow from './PullRequestRow'
import { getPullRequests, savePullRequest, updatePullRequest, deletePullRequest } from '../../services/firestorePullRequests'
import { getTimeEntries } from '../../services/firestoreTimeEntries'
import type { PullRequest, PrStatus, PrHistoryEntry } from '../../types/pullRequest'
import { PR_STATUSES } from '../../types/pullRequest'
import type { TimeEntry } from '../../types/entry'
import styles from './PullRequestsPage.module.css'
import { useToastStore } from '../../stores/toast'

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const addToast = useToastStore(s => s.addToast)

  const [nummer, setNummer] = useState('')
  const [titel, setTitel] = useState('')
  const [status, setStatus] = useState<PrStatus>('Open')
  const [reviewer, setReviewer] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('')
  const [nummerError, setNummerError] = useState('')
  const [titelError, setTitelError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<PrStatus>('Open')

  useEffect(() => {
    Promise.all([getPullRequests(), getTimeEntries()]).then(([p, e]) => {
      setPrs(p)
      setTimeEntries(e)
      setIsLoading(false)
    }).catch(() => {
      setLoadError('Pull Requests konnten nicht geladen werden.')
      setIsLoading(false)
    })
  }, [])

  function resetForm() {
    setEditingId(null)
    setNummer('')
    setTitel('')
    setStatus('Open')
    setReviewer('')
    setKommentar('')
    setFaelligkeitsdatum('')
    setNummerError('')
    setTitelError('')
    setOriginalStatus('Open')
  }

  async function handleSubmit() {
    let valid = true
    if (!nummer.trim()) { setNummerError('Nummer ist erforderlich'); valid = false } else setNummerError('')
    if (!titel.trim()) { setTitelError('Titel ist erforderlich'); valid = false } else setTitelError('')
    if (!valid) return
    try {
      if (editingId) {
        const existing = prs.find(p => p.id === editingId)
        const existingHistory: PrHistoryEntry[] = existing?.history ?? []
        const newEntry: PrHistoryEntry[] = status !== originalStatus
          ? [{ timestamp: new Date().toISOString(), von: originalStatus, nach: status }]
          : []
        const history = [...existingHistory, ...newEntry]
        await updatePullRequest(editingId, {
          nummer: nummer.trim(), titel: titel.trim(), status,
          reviewer: reviewer.trim(), kommentar, faelligkeitsdatum: faelligkeitsdatum.trim() || null, history,
        })
        const now = new Date().toISOString()
        setPrs(prev => prev.map(p => p.id === editingId
          ? { ...p, nummer: nummer.trim(), titel: titel.trim(), status, reviewer: reviewer.trim(), kommentar, faelligkeitsdatum: faelligkeitsdatum.trim() || null, history, updatedAt: now }
          : p
        ))
      } else {
        const saved = await savePullRequest({
          nummer: nummer.trim(), titel: titel.trim(), status,
          reviewer: reviewer.trim(), kommentar, faelligkeitsdatum: faelligkeitsdatum.trim() || null, history: [],
        })
        setPrs(prev => [saved, ...prev])
      }
      resetForm()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
    }
  }

  function handleEdit(pr: PullRequest) {
    setEditingId(pr.id)
    setNummer(pr.nummer)
    setTitel(pr.titel)
    setStatus(pr.status)
    setOriginalStatus(pr.status)
    setReviewer(pr.reviewer)
    setKommentar(pr.kommentar)
    setFaelligkeitsdatum(pr.faelligkeitsdatum ?? '')
  }

  async function handleDelete(id: string) {
    try {
      await deletePullRequest(id)
      setPrs(prev => prev.filter(p => p.id !== id))
    } catch {
      addToast('error', 'Fehler beim Löschen. Bitte erneut versuchen.')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <h1 className={styles.h1}>Pull Requests</h1>
        <p className={styles.subtitle}>{prs.length} {prs.length === 1 ? 'PR' : 'PRs'}</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formField}>
          <label htmlFor="pr-nummer" className={styles.formLabel}>Nummer *</label>
          <input
            id="pr-nummer"
            aria-label="Nummer"
            className={[styles.formInput, styles.formInputMono, nummerError ? styles.error : ''].filter(Boolean).join(' ')}
            value={nummer}
            onChange={e => setNummer(e.target.value)}
            placeholder="42"
            style={{ minWidth: 80, maxWidth: 100 }}
          />
          {nummerError && <span className={styles.errorText}>{nummerError}</span>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="pr-titel" className={styles.formLabel}>Titel *</label>
          <input
            id="pr-titel"
            aria-label="Titel"
            className={[styles.formInput, titelError ? styles.error : ''].filter(Boolean).join(' ')}
            value={titel}
            onChange={e => setTitel(e.target.value)}
            placeholder="fix: kurzbeschreibung"
          />
          {titelError && <span className={styles.errorText}>{titelError}</span>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="pr-reviewer" className={styles.formLabel}>Reviewer</label>
          <input
            id="pr-reviewer"
            aria-label="Reviewer"
            className={styles.formInput}
            value={reviewer}
            onChange={e => setReviewer(e.target.value)}
            placeholder="Optional"
            style={{ minWidth: 120 }}
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="pr-status" className={styles.formLabel}>Status</label>
          <select
            id="pr-status"
            className={styles.formSelect}
            value={status}
            onChange={e => setStatus(e.target.value as PrStatus)}
          >
            {PR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="pr-kommentar" className={styles.formLabel}>Kommentar</label>
          <input
            id="pr-kommentar"
            className={styles.formInput}
            value={kommentar}
            onChange={e => setKommentar(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="pr-faelligkeitsdatum" className={styles.formLabel}>Fälligkeit</label>
          <input
            id="pr-faelligkeitsdatum"
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
          <span>Nummer</span>
          <span>Titel</span>
          <span>Reviewer</span>
          <span>Status</span>
          <span>Fälligkeit</span>
          <span>Kommentar</span>
          <span>Aktionen</span>
        </div>
        {isLoading && <p className={styles.loading}>Laden…</p>}
        {loadError && <p role="alert" className={styles.loadError}>{loadError}</p>}
        {!isLoading && !loadError && prs.length === 0 && (
          <p className={styles.empty}>Noch keine Pull Requests vorhanden.</p>
        )}
        {prs.map(pr => (
          <PullRequestRow
            key={pr.id}
            pr={pr}
            timeEntries={timeEntries}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </main>
  )
}
