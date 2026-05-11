import { useState, useEffect } from 'react'
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

  return (
    <div className={styles.app}>
      <h1>Leistungserfassung</h1>
      <EntryForm onSave={handleSave} onCancel={handleCancel} initialData={editData} key={editId ?? 'new'} />
      <EntryTable eintraege={eintraege} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}
