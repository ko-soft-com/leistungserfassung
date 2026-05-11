import { useRef, useState } from 'react'
import type { Eintrag, EintragFormData } from '../types/entry'
import { exportToCsv, importFromCsv } from '../utils/csv'
import styles from './CsvToolbar.module.css'

interface Props {
  eintraege: Eintrag[]
  onImport: (entries: EintragFormData[]) => void
}

export default function CsvToolbar({ eintraege, onImport }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (eintraege.length === 0) {
      setMessage('Keine Einträge zum Exportieren.')
      return
    }
    const csv = exportToCsv(eintraege)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const today = new Date().toISOString().split('T')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `leistungserfassung-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(`${eintraege.length} Einträge exportiert.`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { imported, skipped } = importFromCsv(text)
      onImport(imported)
      const msg =
        skipped > 0
          ? `${imported.length} Einträge importiert, ${skipped} übersprungen.`
          : `${imported.length} Einträge importiert.`
      setMessage(msg)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  return (
    <div className={styles.toolbar}>
      <button type="button" className={styles.exportBtn} onClick={handleExport}>
        CSV exportieren
      </button>
      <button
        type="button"
        className={styles.importBtn}
        onClick={() => fileInputRef.current?.click()}
      >
        CSV importieren
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />
      {message && <span className={styles.message}>{message}</span>}
    </div>
  )
}
