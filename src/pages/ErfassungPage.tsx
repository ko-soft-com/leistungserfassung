import { useState } from 'react'
import { format, getISOWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download, Upload } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import Button from '../components/Button'
import NewEntryCard from '../features/new-entry/NewEntryCard'
import Toolbar from '../features/filters/Toolbar'
import EntryTable from '../features/entry-list/EntryTable'
import { applyFilter } from '../data/filter'
import { getTimeEntries } from '../services/storage'
import type { TimeEntry } from '../types/entry'
import styles from './ErfassungPage.module.css'

type Range = 'today' | 'week' | 'month' | 'custom'

export default function ErfassungPage() {
  const today = new Date()
  const kw = getISOWeek(today)
  const weekday = format(today, 'EEEE', { locale: de })
  const dateStr = format(today, 'dd.MM.yyyy')

  const [range, setRange] = useState<Range>('week')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const entries: TimeEntry[] = getTimeEntries()
  const filtered = applyFilter(entries, { range, search, client: selectedClient ?? undefined })
  const clients = [...new Set(entries.map(e => e.client))]

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

      <Toolbar
        range={range}
        onRangeChange={setRange}
        search={search}
        onSearchChange={setSearch}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
      />

      <EntryTable
        entries={filtered}
        onEdit={id => console.log('edit', id)}
        onDelete={id => console.log('delete', id)}
      />
    </main>
  )
}
