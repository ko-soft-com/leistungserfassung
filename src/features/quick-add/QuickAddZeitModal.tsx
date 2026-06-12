import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/Button'
import Field from '../../components/Field'
import IssueTypeSelector from '../../components/IssueTypeSelector'
import TaskTypeSelector from '../../components/TaskTypeSelector'
import { useDraft } from '../new-entry/useDraft'
import { buildSuggestions } from '../new-entry/suggestions'
import { saveTimeEntry, getTimeEntries } from '../../services/firestoreTimeEntries'
import { useRefreshStore } from '../../stores/refresh'
import { useToastStore } from '../../stores/toast'
import styles from './QuickAddZeitModal.module.css'

interface Props { onClose: () => void }

export default function QuickAddZeitModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const { draft, setField, errors, validate, reset } = useDraft()
  const [saving, setSaving] = useState(false)
  const [sugg, setSugg] = useState(() => buildSuggestions([]))

  const incrementZeit = useRefreshStore(s => s.incrementZeit)
  const addToast      = useToastStore(s => s.addToast)

  useEffect(() => {
    let isMounted = true
    const dialog = dialogRef.current
    dialog?.showModal()
    const handleClose = () => onCloseRef.current()
    dialog?.addEventListener('close', handleClose)
    getTimeEntries().then(entries => { if (isMounted) setSugg(buildSuggestions(entries)) }).catch(() => {})
    return () => {
      isMounted = false
      dialog?.removeEventListener('close', handleClose)
    }
  }, [])

  function close() { dialogRef.current?.close() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await saveTimeEntry({
        date: draft.date,
        start: draft.start || null,
        end: draft.end || null,
        client: draft.client,
        orderNo: draft.orderNo,
        account: draft.account,
        task: draft.task,
        description: draft.description,
        jira: draft.jira || undefined,
        pr: draft.pr || undefined,
        jiraIssueType: draft.jiraIssueType || undefined,
      })
      incrementZeit()
      addToast('success', 'Zeiteintrag gespeichert.')
      reset()
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
        <span className={styles.title}>Neuer Zeiteintrag</span>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Schließen">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <Field label="Auftraggeber" required value={draft.client}  onChange={v => setField('client', v)}  error={errors.client}  suggestions={sugg.client} />
          <Field label="Auftragsnr."  required value={draft.orderNo} onChange={v => setField('orderNo', v)} error={errors.orderNo} suggestions={sugg.orderNo} />
          <Field label="Zeitkonto"    required value={draft.account} onChange={v => setField('account', v)} error={errors.account} suggestions={sugg.account} />
        </div>
        <div className={styles.row}>
          <Field label="Start" mono type="time" value={draft.start ?? ''} onChange={v => setField('start', v || null)} error={errors.start} />
          <Field label="Ende"  mono type="time" value={draft.end}         onChange={v => setField('end', v)}           error={errors.end} />
        </div>
        <div className={styles.taskRow}>
          <TaskTypeSelector value={draft.task} onChange={v => setField('task', v)} name="qa-zeit-task" />
        </div>
        <Field label="Beschreibung" value={draft.description} onChange={v => setField('description', v)} error={errors.description} suggestions={sugg.description} />
        <div className={styles.row}>
          <Field label="JIRA-Ticket"  mono value={draft.jira} onChange={v => setField('jira', v)} suggestions={sugg.jira} />
          <Field label="Pull-Request" mono value={draft.pr}   onChange={v => setField('pr', v)}   suggestions={sugg.pr} />
        </div>
        <IssueTypeSelector value={draft.jiraIssueType} onChange={v => setField('jiraIssueType', v ?? '')} />
        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={() => { reset(); close() }}>Abbrechen</Button>
          <Button variant="primary" type="submit" disabled={saving}>Speichern</Button>
        </div>
      </form>
    </dialog>
  )
}
