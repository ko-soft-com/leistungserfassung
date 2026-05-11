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
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage(`${eintraege.length} Einträge exportiert.`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onerror = () => setMessage('Fehler beim Lesen der Datei.')
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const { imported, skipped } = importFromCsv(text)
        onImport(imported)
        const msg =
          skipped > 0
            ? `${imported.length} Einträge importiert, ${skipped} übersprungen.`
            : `${imported.length} Einträge importiert.`
        setMessage(msg)
      } catch {
        setMessage('Die Datei konnte nicht importiert werden.')
      }
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
        aria-label="CSV-Datei importieren"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />
      <span role="status" aria-live="polite" className={styles.message}>
        {message ?? ''}
      </span>
    </div>
  )
}
