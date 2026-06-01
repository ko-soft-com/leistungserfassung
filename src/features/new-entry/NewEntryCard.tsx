import { useState } from 'react'
import { Plus, Play, Square, Check, X } from 'lucide-react'
import { useDraft, roundTo5 } from './useDraft'
import { useTimerStore } from '../../stores/timer'
import { getLastUsed, setLastUsed } from './suggestions'
import Field from '../../components/Field'
import Button from '../../components/Button'
import { saveTimeEntry } from '../../services/firestoreTimeEntries'
import type { TimeEntry } from '../../types/entry'
import { TASK_TYPES } from '../../types/entry'
import IssueTypeSelector from '../../components/IssueTypeSelector'
import styles from './NewEntryCard.module.css'
import { useElapsedTime } from '../../hooks/useElapsedTime'

interface NewEntryCardProps {
  onSaved?: (entry: TimeEntry) => void
}

export default function NewEntryCard({ onSaved }: NewEntryCardProps = {}) {
  const { draft, setField, errors, validate, reset } = useDraft()
  const [durationMins, setDurationMins] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const lastUsed = getLastUsed()
  const { activeTimer, startTimer, stopTimer } = useTimerStore()
  const elapsed = useElapsedTime(activeTimer?.startedAt ?? null)

  function handleStartTimer() {
    setField('start', roundTo5(new Date()))
    startTimer({ client: draft.client, orderNo: draft.orderNo, account: draft.account })
  }

  function handleStopTimer() {
    if (!activeTimer) return
    setField('end', roundTo5(new Date()))
    setDurationMins('')
    stopTimer()
  }

  async function handleSave() {
    if (!validate()) return
    setSaveError(null)
    try {
      const saved = await saveTimeEntry({
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
      setLastUsed({ client: draft.client, orderNo: draft.orderNo, account: draft.account })
      onSaved?.(saved)
      reset()
      setDurationMins('')
    } catch {
      setSaveError('Fehler beim Speichern.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { reset(); setDurationMins('') }
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const mins = Number(e.target.value)
    if (!mins || !draft.start) return
    const [h, m] = draft.start.split(':').map(Number)
    const total = h * 60 + m + mins
    setField('end', `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`)
  }

  return (
    <div className={styles.card} onKeyDown={handleKeyDown}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Plus size={15} color="var(--accent)" />
          <span className={styles.title}>Neuer Eintrag</span>
          <input
            type="date"
            aria-label="Datum"
            className={styles.dateInput}
            value={draft.date}
            onChange={e => setField('date', e.target.value)}
          />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.caption}>Stoppuhr</span>
          {activeTimer && <span className={styles.elapsed}>{elapsed}</span>}
          {activeTimer ? (
            <button className={styles.startPill} type="button" onClick={handleStopTimer}>
              <Square size={11} /> Stop
            </button>
          ) : (
            <button className={styles.startPill} type="button" onClick={handleStartTimer}>
              <Play size={11} /> Start
            </button>
          )}
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
            onSuggestionClick={lastUsed.client ? () => setField('client', lastUsed.client) : undefined}
          />
          <Field
            label="Auftragsnr." required
            value={draft.orderNo}
            onChange={v => setField('orderNo', v)}
            error={errors.orderNo}
            suggestion={lastUsed.orderNo ? 'letzte' : undefined}
            onSuggestionClick={lastUsed.orderNo ? () => setField('orderNo', lastUsed.orderNo) : undefined}
          />
          <Field
            label="Zeitkonto" required
            value={draft.account}
            onChange={v => setField('account', v)}
            error={errors.account}
            suggestion={lastUsed.account ? 'letzte' : undefined}
            onSuggestionClick={lastUsed.account ? () => setField('account', lastUsed.account) : undefined}
          />
          <div className={styles.taskSelect}>
            <label className={styles.taskLabel} htmlFor="task-select">Aufgabe</label>
            <select
              id="task-select"
              className={styles.taskInput}
              value={draft.task}
              onChange={e => setField('task', e.target.value as typeof TASK_TYPES[number])}
            >
              {TASK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Field label="Start" mono type="time" value={draft.start ?? ''} onChange={v => { setField('start', v || null); setDurationMins('') }} error={errors.start} />
          <Field label="Ende" mono type="time" value={draft.end} onChange={v => { setField('end', v); setDurationMins('') }} error={errors.end} />
          <div className={styles.taskSelect}>
            <label className={styles.taskLabel} htmlFor="duration-select">Dauer</label>
            <select
              id="duration-select"
              className={styles.taskInput}
              value={durationMins}
              onChange={e => {
                setDurationMins(e.target.value)
                handleDurationChange(e)
              }}
            >
              <option value="">– wählen –</option>
              {Array.from({ length: 32 }, (_, i) => {
                const mins = (i + 1) * 15
                const h = Math.floor(mins / 60)
                const m = mins % 60
                return (
                  <option key={mins} value={mins}>
                    {`${h}:${String(m).padStart(2, '0')} h`}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className={styles.row2}>
          <Field label="Beschreibung" multiline rows={2} value={draft.description} onChange={v => setField('description', v)} error={errors.description} />
          <Field label="JIRA-Ticket" mono value={draft.jira} onChange={v => setField('jira', v)} />
          <Field label="Pull-Request" mono value={draft.pr} onChange={v => setField('pr', v)} />
          <div className={styles.actions}>
            {saveError && <span role="alert" style={{ fontSize: '0.8125rem', color: 'var(--clr-error, #d32f2f)' }}>{saveError}</span>}
            <Button variant="ghost" type="button" onClick={() => { reset(); setDurationMins(''); setSaveError(null) }}><X size={13} /> Abbrechen</Button>
            <Button variant="primary" type="submit"><Check size={13} /> Speichern</Button>
          </div>
        </div>
        <div className={styles.row3}>
          <IssueTypeSelector
            value={draft.jiraIssueType}
            onChange={v => setField('jiraIssueType', v ?? '')}
          />
        </div>
      </form>
    </div>
  )
}
