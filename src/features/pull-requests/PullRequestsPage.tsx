import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../components/Button'
import PullRequestRow from './PullRequestRow'
import { getPullRequests, savePullRequest, updatePullRequest, deletePullRequest } from '../../services/firestorePullRequests'
import { getTimeEntries } from '../../services/firestoreTimeEntries'
import type { PullRequest, PrStatus } from '../../types/pullRequest'
import { PR_STATUSES } from '../../types/pullRequest'
import type { TimeEntry } from '../../types/entry'
import styles from './PullRequestsPage.module.css'

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [status, setStatus] = useState<PrStatus>('Open')
  const [kommentar, setKommentar] = useState('')
  const [nameError, setNameError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

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
    setName('')
    setStatus('Open')
    setKommentar('')
    setNameError('')
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError('Name ist erforderlich')
      return
    }
    setNameError('')

    if (editingId) {
      await updatePullRequest(editingId, { name: name.trim(), status, kommentar })
      const now = new Date().toISOString()
      setPrs(prev =>
        prev.map(p => p.id === editingId ? { ...p, name: name.trim(), status, kommentar, updatedAt: now } : p)
      )
    } else {
      const saved = await savePullRequest({ name: name.trim(), status, kommentar })
      setPrs(prev => [saved, ...prev])
    }
    resetForm()
  }

  function handleEdit(pr: PullRequest) {
    setEditingId(pr.id)
    setName(pr.name)
    setStatus(pr.status)
    setKommentar(pr.kommentar)
  }

  async function handleDelete(id: string) {
    await deletePullRequest(id)
    setPrs(prev => prev.filter(p => p.id !== id))
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <h1 className={styles.h1}>Pull Requests</h1>
        <p className={styles.subtitle}>{prs.length} {prs.length === 1 ? 'PR' : 'PRs'}</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formField}>
          <label htmlFor="pr-name" className={styles.formLabel}>Name *</label>
          <input
            id="pr-name"
            aria-label="Name"
            className={[styles.formInput, nameError ? styles.error : ''].filter(Boolean).join(' ')}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="fix: kurzbeschreibung"
          />
          {nameError && <span className={styles.errorText}>{nameError}</span>}
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
          <span>Name</span>
          <span>Status</span>
          <span>Kommentar</span>
          <span>Aktionen</span>
        </div>
        {isLoading && <p className={styles.loading}>Laden…</p>}
        {loadError && <p role="alert" style={{ color: 'var(--danger)', margin: '0.5rem 0', fontSize: '13px' }}>{loadError}</p>}
        {!isLoading && prs.length === 0 && (
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
