import { useState, useEffect, useMemo } from 'react'
import EntryForm from './components/EntryForm'
import EntryTable from './components/EntryTable'
import { getEintraege, saveEintrag, updateEintrag, deleteEintrag } from './services/storage'
import type { Eintrag, EintragFormData } from './types/entry'
import styles from './App.module.css'

export default function App() {
  const [eintraege, setEintraege] = useState<Eintrag[]>([])
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    setEintraege(getEintraege())
  }, [])

  const handleSave = (data: EintragFormData) => {
    if (editId) {
      updateEintrag(editId, data)
      setEditId(null)
    } else {
      saveEintrag(data)
    }
    setEintraege(getEintraege())
  }

  const handleEdit = (id: string) => setEditId(id)

  const handleDelete = (id: string) => {
    deleteEintrag(id)
    setEintraege(getEintraege())
  }

  const handleCancel = () => setEditId(null)

  const editData = editId
    ? (({ id, createdAt, ...rest }) => rest)(eintraege.find((e) => e.id === editId)!)
    : undefined

  const suggestions = useMemo(() => {
    const unique = (vals: (string | undefined)[]) =>
      [...new Set(vals.filter(Boolean))] as string[]
    return {
      auftraggeber: unique(eintraege.map((e) => e.auftraggeber)),
      auftragsnummer: unique(eintraege.map((e) => e.auftragsnummer)),
      auftrag: unique(eintraege.map((e) => e.auftrag)),
      zeitkonto: unique(eintraege.map((e) => e.zeitkonto)),
      aufgabe: unique(eintraege.map((e) => e.aufgabe)),
      datum: unique(eintraege.map((e) => e.datum)),
      externeId: unique(eintraege.map((e) => e.externeId)),
      jiraTicket: unique(eintraege.map((e) => e.jiraTicket)),
      prLink: unique(eintraege.map((e) => e.prLink)),
    }
  }, [eintraege])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Leistungserfassung</h1>
        <p className={styles.subtitle}>Arbeitszeiterfassung</p>
      </header>
      <div className={styles.content}>
        <EntryForm
          onSave={handleSave}
          onCancel={handleCancel}
          initialData={editData}
          key={editId ?? 'new'}
          suggestions={suggestions}
        />
        <EntryTable eintraege={eintraege} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
