import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/Button'
import { saveJiraTicket } from '../../services/firestoreJiraTickets'
import { useRefreshStore } from '../../stores/refresh'
import { useToastStore } from '../../stores/toast'
import type { JiraStatus } from '../../types/jiraTicket'
import { JIRA_STATUSES } from '../../types/jiraTicket'
import type { JiraIssueType } from '../../types/entry'
import { JIRA_ISSUE_TYPES } from '../../types/entry'
import styles from './QuickAddJiraModal.module.css'

interface Props { onClose: () => void }

export default function QuickAddJiraModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [nummer, setNummer] = useState('')
  const [titel, setTitel] = useState('')
  const [issueType, setIssueType] = useState<JiraIssueType>('Task')
  const [status, setStatus] = useState<JiraStatus>('Offen')
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [nummerError, setNummerError] = useState('')
  const [titelError, setTitelError] = useState('')
  const [saving, setSaving] = useState(false)

  const incrementJira = useRefreshStore(s => s.incrementJira)
  const addToast      = useToastStore(s => s.addToast)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    const handleClose = () => onCloseRef.current()
    dialog?.addEventListener('close', handleClose)
    return () => dialog?.removeEventListener('close', handleClose)
  }, [])

  function close() { dialogRef.current?.close() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true
    if (!nummer.trim()) { setNummerError('Nummer ist erforderlich'); valid = false } else setNummerError('')
    if (!titel.trim())  { setTitelError('Titel ist erforderlich');   valid = false } else setTitelError('')
    if (!valid) return
    setSaving(true)
    try {
      await saveJiraTicket({
        nummer: nummer.trim(), titel: titel.trim(), issueType, status,
        beschreibung, kommentar, faelligkeitsdatum: faelligkeitsdatum.trim() || null,
      })
      incrementJira()
      addToast('success', 'Jira-Ticket gespeichert.')
      close()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.header}>
        <span className={styles.title}>Neues Jira-Ticket</span>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Schließen">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-nummer">Nummer *</label>
          <input id="qa-jira-nummer" className={styles.input} value={nummer} onChange={e => setNummer(e.target.value)} />
          {nummerError && <span className={styles.error}>{nummerError}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-titel">Titel *</label>
          <input id="qa-jira-titel" className={styles.input} value={titel} onChange={e => setTitel(e.target.value)} />
          {titelError && <span className={styles.error}>{titelError}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-type">Typ</label>
          <select id="qa-jira-type" className={styles.select} value={issueType} onChange={e => setIssueType(e.target.value as JiraIssueType)}>
            {JIRA_ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-status">Status</label>
          <select id="qa-jira-status" className={styles.select} value={status} onChange={e => setStatus(e.target.value as JiraStatus)}>
            {JIRA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-faellig">Fälligkeit</label>
          <input id="qa-jira-faellig" type="date" className={styles.input} value={faelligkeitsdatum} onChange={e => setFaelligkeitsdatum(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-beschreibung">Beschreibung</label>
          <textarea id="qa-jira-beschreibung" className={styles.textarea} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-jira-kommentar">Kommentar</label>
          <textarea id="qa-jira-kommentar" className={styles.textarea} value={kommentar} onChange={e => setKommentar(e.target.value)} rows={2} />
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={close}>Abbrechen</Button>
          <Button variant="primary" type="submit" disabled={saving}>Speichern</Button>
        </div>
      </form>
    </dialog>
  )
}
