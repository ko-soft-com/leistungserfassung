import type { Eintrag } from '../types/entry'
import EntryRow from './EntryRow'
import styles from './EntryTable.module.css'

interface Props {
  eintraege: Eintrag[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function EntryTable({ eintraege, onEdit, onDelete }: Props) {
  if (eintraege.length === 0) {
    return <p className={styles.empty}>Noch keine Einträge vorhanden.</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <colgroup>
          <col style={{ width: '90px' }} />
          <col style={{ width: '66px' }} />
          <col style={{ width: '66px' }} />
          <col />
          <col style={{ width: '88px' }} />
          <col />
          <col />
          <col />
          <col style={{ width: '72px' }} />
          <col />
          <col style={{ width: '80px' }} />
          <col style={{ width: '90px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '130px' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Startzeit</th>
            <th>Endzeit</th>
            <th>Auftraggeber</th>
            <th>Auftragsnr.</th>
            <th>Auftrag</th>
            <th>Zeitkonto</th>
            <th>Aufgabe</th>
            <th>Dauer</th>
            <th>Beschreibung</th>
            <th>Externe-ID</th>
            <th>JIRA-Ticket</th>
            <th>Pull-Request</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((e) => (
            <EntryRow key={e.id} entry={e} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
