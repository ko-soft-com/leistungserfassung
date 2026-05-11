import type { Eintrag } from '../types/entry'
import styles from './EntryRow.module.css'

interface Props {
  entry: Eintrag
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const formatDate = (iso: string): string => {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}.${m}.${y}`
}

const formatDauer = (stunden: number, minuten: number): string => {
  if (!Number.isFinite(stunden) || !Number.isFinite(minuten)) return '–'
  return `${stunden}h ${String(minuten).padStart(2, '0')}m`
}

export default function EntryRow({ entry, onEdit, onDelete }: Props) {
  const handleDelete = () => {
    if (window.confirm(`Eintrag vom ${formatDate(entry.datum)} wirklich löschen?`)) {
      onDelete(entry.id)
    }
  }

  return (
    <tr className={styles.row}>
      <td data-label="Datum">{formatDate(entry.datum)}</td>
      <td data-label="Startzeit">{entry.startzeit ?? ''}</td>
      <td data-label="Endzeit">{entry.endzeit ?? ''}</td>
      <td data-label="Auftraggeber">{entry.auftraggeber}</td>
      <td data-label="Auftragsnr.">{entry.auftragsnummer}</td>
      <td data-label="Auftrag">{entry.auftrag}</td>
      <td data-label="Zeitkonto">{entry.zeitkonto}</td>
      <td data-label="Aufgabe">{entry.aufgabe}</td>
      <td data-label="Dauer">{formatDauer(entry.dauer.stunden, entry.dauer.minuten)}</td>
      <td data-label="Beschreibung">{entry.beschreibung ?? ''}</td>
      <td data-label="Externe-ID">{entry.externeId ?? ''}</td>
      <td data-label="JIRA-Ticket">{entry.jiraTicket ?? ''}</td>
      <td data-label="PR">{entry.prLink ?? ''}</td>
      <td data-label="">
        <button
          type="button"
          aria-label={`Eintrag vom ${formatDate(entry.datum)} bearbeiten`}
          onClick={() => onEdit(entry.id)}
          className={styles.editBtn}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          aria-label={`Eintrag vom ${formatDate(entry.datum)} löschen`}
          onClick={handleDelete}
          className={styles.deleteBtn}
        >
          Löschen
        </button>
      </td>
    </tr>
  )
}
