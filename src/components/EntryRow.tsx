import type { Eintrag } from '../types/entry'
import styles from './EntryRow.module.css'

interface Props {
  entry: Eintrag
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const formatDauer = (stunden: number, minuten: number) =>
  `${stunden}h ${minuten}m`

export default function EntryRow({ entry, onEdit, onDelete }: Props) {
  const handleDelete = () => {
    if (window.confirm(`Eintrag vom ${formatDate(entry.datum)} wirklich löschen?`)) {
      onDelete(entry.id)
    }
  }

  return (
    <tr className={styles.row}>
      <td>{formatDate(entry.datum)}</td>
      <td>{entry.startzeit ?? ''}</td>
      <td>{entry.endzeit ?? ''}</td>
      <td>{entry.auftraggeber}</td>
      <td>{entry.auftragsnummer}</td>
      <td>{entry.auftrag}</td>
      <td>{entry.zeitkonto}</td>
      <td>{entry.aufgabe}</td>
      <td>{formatDauer(entry.dauer.stunden, entry.dauer.minuten)}</td>
      <td>{entry.beschreibung ?? ''}</td>
      <td>{entry.externeId ?? ''}</td>
      <td>{entry.jiraTicket ?? ''}</td>
      <td>
        {entry.prLink
          ? <a href={entry.prLink} target="_blank" rel="noreferrer">{entry.prLink}</a>
          : ''}
      </td>
      <td>
        <button onClick={() => onEdit(entry.id)} className={styles.editBtn}>Bearbeiten</button>
        <button onClick={handleDelete} className={styles.deleteBtn}>Löschen</button>
      </td>
    </tr>
  )
}
