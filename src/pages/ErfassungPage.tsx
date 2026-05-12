import { format, getISOWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download, Upload } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import Button from '../components/Button'
import NewEntryCard from '../features/new-entry/NewEntryCard'
import styles from './ErfassungPage.module.css'

export default function ErfassungPage() {
  const today = new Date()
  const kw = getISOWeek(today)
  const weekday = format(today, 'EEEE', { locale: de })
  const dateStr = format(today, 'dd.MM.yyyy')

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <div>
          <div className={styles.kwLabel}>{weekday.charAt(0).toUpperCase() + weekday.slice(1)} · KW {kw}</div>
          <h1 className={styles.h1}>Zeiterfassung — {dateStr}</h1>
        </div>
        <div className={styles.titleActions}>
          <Button variant="secondary"><Download size={14} /> CSV exportieren</Button>
          <Button variant="secondary"><Upload size={14} /> CSV importieren</Button>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <KpiCard label="Heute" value="0:00h" sublabel="von 8h Soll" progress={0} />
        <KpiCard label="Diese Woche" value="0:00h" sublabel="von 40h Soll" progress={0} />
        <KpiCard label="Überstunden" value="+0:00h" sublabel="Saldo Mai" progress={0} />
        <KpiCard label="Offene Tickets" value="0" sublabel="Keine offenen" progress={0} />
      </div>

      <NewEntryCard />

      {/* Toolbar, EntryTable — added in later tasks */}
    </main>
  )
}
