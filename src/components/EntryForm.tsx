import { useState } from 'react'
import type { EintragFormData } from '../types/entry'
import styles from './EntryForm.module.css'

interface Props {
  onSave: (data: EintragFormData) => void
  onCancel?: () => void
  initialData?: EintragFormData
}

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = (): EintragFormData => ({
  auftraggeber: '',
  auftragsnummer: '',
  auftrag: '',
  zeitkonto: '',
  aufgabe: '',
  datum: today(),
  dauer: { stunden: 0, minuten: 0 },
  beschreibung: '',
  externeId: '',
})

export default function EntryForm({ onSave, onCancel, initialData }: Props) {
  const [form, setForm] = useState<EintragFormData>(initialData ?? emptyForm())
  const isEdit = Boolean(initialData)

  const set = <K extends keyof EintragFormData>(field: K, value: EintragFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
    if (!isEdit) setForm(emptyForm())
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <label>
          Auftraggeber *
          <input required value={form.auftraggeber} onChange={(e) => set('auftraggeber', e.target.value)} />
        </label>
        <label>
          Auftragsnummer *
          <input required value={form.auftragsnummer} onChange={(e) => set('auftragsnummer', e.target.value)} />
        </label>
        <div className={styles.auftragField}>
          <label htmlFor="auftrag">Auftrag</label>
          <input id="auftrag" required value={form.auftrag} onChange={(e) => set('auftrag', e.target.value)} />
        </div>
        <label>
          Zeitkonto *
          <input required value={form.zeitkonto} onChange={(e) => set('zeitkonto', e.target.value)} />
        </label>
        <label>
          Aufgabe *
          <input required value={form.aufgabe} onChange={(e) => set('aufgabe', e.target.value)} />
        </label>
        <label>
          Datum *
          <input type="date" required value={form.datum} onChange={(e) => set('datum', e.target.value)} />
        </label>
        <div className={styles.dauerRow}>
          <label>
            Stunden *
            <input
              type="number" min={0} max={23} required
              value={form.dauer.stunden}
              onChange={(e) => set('dauer', { ...form.dauer, stunden: Number(e.target.value) })}
            />
          </label>
          <label>
            Minuten *
            <input
              type="number" min={0} max={59} step={15} required
              value={form.dauer.minuten}
              onChange={(e) => set('dauer', { ...form.dauer, minuten: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Externe-ID
          <input value={form.externeId ?? ''} onChange={(e) => set('externeId', e.target.value)} />
        </label>
        <label className={styles.fullWidth}>
          Beschreibung
          <textarea value={form.beschreibung ?? ''} onChange={(e) => set('beschreibung', e.target.value)} rows={3} />
        </label>
      </div>
      <div className={styles.actions}>
        <button type="submit">{isEdit ? 'Aktualisieren' : 'Speichern'}</button>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancel}>Abbrechen</button>
        )}
      </div>
    </form>
  )
}
