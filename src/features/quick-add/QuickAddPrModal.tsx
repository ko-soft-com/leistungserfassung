import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/Button'
import { savePullRequest, getPullRequests } from '../../services/firestorePullRequests'
import { useRefreshStore } from '../../stores/refresh'
import { useToastStore } from '../../stores/toast'
import type { PrStatus, PullRequest } from '../../types/pullRequest'
import { PR_STATUSES } from '../../types/pullRequest'
import styles from './QuickAddPrModal.module.css'

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))].sort()
}

interface Props { onClose: () => void }

export default function QuickAddPrModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [nummer, setNummer] = useState('')
  const [titel, setTitel] = useState('')
  const [status, setStatus] = useState<PrStatus>('Open')
  const [reviewer, setReviewer] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('')
  const [nummerError, setNummerError] = useState('')
  const [titelError, setTitelError] = useState('')
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<PullRequest[]>([])

  const incrementPr = useRefreshStore(s => s.incrementPr)
  const addToast    = useToastStore(s => s.addToast)

  useEffect(() => {
    let isMounted = true
    const dialog = dialogRef.current
    dialog?.showModal()
    const handleClose = () => onCloseRef.current()
    dialog?.addEventListener('close', handleClose)
    getPullRequests().then(p => { if (isMounted) setExisting(p) }).catch(() => {})
    return () => {
      isMounted = false
      dialog?.removeEventListener('close', handleClose)
    }
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
      await savePullRequest({
        nummer: nummer.trim(), titel: titel.trim(), status,
        reviewer: reviewer.trim(), kommentar,
        faelligkeitsdatum: faelligkeitsdatum.trim() || null,
        history: [],
      })
      incrementPr()
      addToast('success', 'Pull Request gespeichert.')
      close()
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.header}>
        <span className={styles.title}>Neuer Pull Request</span>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Schließen">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-nummer">Nummer *</label>
          <input id="qa-pr-nummer" className={styles.input} value={nummer} onChange={e => setNummer(e.target.value)} list="qa-pr-nummer-list" />
          {nummerError && <span className={styles.error}>{nummerError}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-titel">Titel *</label>
          <input id="qa-pr-titel" className={styles.input} value={titel} onChange={e => setTitel(e.target.value)} list="qa-pr-titel-list" />
          {titelError && <span className={styles.error}>{titelError}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-status">Status</label>
          <select id="qa-pr-status" className={styles.select} value={status} onChange={e => setStatus(e.target.value as PrStatus)}>
            {PR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-reviewer">Reviewer</label>
          <input id="qa-pr-reviewer" className={styles.input} value={reviewer} onChange={e => setReviewer(e.target.value)} list="qa-pr-reviewer-list" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-faellig">Fälligkeit</label>
          <input id="qa-pr-faellig" type="date" className={styles.input} value={faelligkeitsdatum} onChange={e => setFaelligkeitsdatum(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="qa-pr-kommentar">Kommentar</label>
          <textarea id="qa-pr-kommentar" className={styles.textarea} value={kommentar} onChange={e => setKommentar(e.target.value)} rows={3} />
        </div>
        <datalist id="qa-pr-nummer-list">
          {uniq(existing.map(p => p.nummer)).map(v => <option key={v} value={v} />)}
        </datalist>
        <datalist id="qa-pr-titel-list">
          {uniq(existing.map(p => p.titel)).map(v => <option key={v} value={v} />)}
        </datalist>
        <datalist id="qa-pr-reviewer-list">
          {uniq(existing.map(p => p.reviewer)).map(v => <option key={v} value={v} />)}
        </datalist>
        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={close}>Abbrechen</Button>
          <Button variant="primary" type="submit" disabled={saving}>Speichern</Button>
        </div>
      </form>
    </dialog>
  )
}
