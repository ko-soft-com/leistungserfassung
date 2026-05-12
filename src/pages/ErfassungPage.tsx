import { useState } from 'react'
import { format, getISOWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download, Upload } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import Button from '../components/Button'
import NewEntryCard from '../features/new-entry/NewEntryCard'
import Toolbar from '../features/filters/Toolbar'
import EntryTable from '../features/entry-list/EntryTable'
import EditEntryDrawer from '../features/entry-list/EditEntryDrawer'
import { applyFilter } from '../data/filter'
import { durationMinutes, fmtH } from '../data/format'
import type { Range } from '../data/filter'
import { getTimeEntries, updateTimeEntry, deleteTimeEntry } from '../services/storage'
import type { TimeEntry } from '../types/entry'
import styles from './ErfassungPage.module.css'

function localISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function ErfassungPage() {
  const today = new Date()
  const kw = getISOWeek(today)
  const weekday = format(today, 'EEEE', { locale: de })
  const dateStr = format(today, 'dd.MM.yyyy')

  const [entries, setEntries] = useState<TimeEntry[]>(() => getTimeEntries())
  const [range, setRange] = useState<Range>('week')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  // ── KPI computation ────────────────────────────────────────────────────────
  const todayStr = localISO(today)
  const todayMins = entries
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + durationMinutes(e), 0)

  const weekStart = new Date(today)
  const day = today.getDay() === 0 ? 7 : today.getDay()
  weekStart.setDate(today.getDate() - day + 1)
  const weekMins = entries
    .filter(e => e.date >= localISO(weekStart) && e.date <= todayStr)
    .reduce((sum, e) => sum + durationMinutes(e), 0)

  const TARGET_DAY_MINS = 8 * 60
  const TARGET_WEEK_MINS = 40 * 60
  const overtimeMins = weekMins - TARGET_WEEK_MINS
  const overtimeStr = `${overtimeMins >= 0 ? '+' : '−'}${fmtH(Math.abs(overtimeMins))}`
  const openCount = entries.filter(e => e.end === null).length

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = applyFilter(entries, { range, search, client: selectedClient ?? undefined })
  const clients = [...new Set(entries.map(e => e.client))].sort()

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  function handleSaved(entry: TimeEntry) {
    setEntries(prev => [entry, ...prev])
  }

  function handleEdit(id: string) {
    const e = entries.find(x => x.id === id)
    if (e) setEditingEntry(e)
  }

  function handleSave(updated: TimeEntry) {
    updateTimeEntry(updated.id, updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : e))
  }

  function handleDelete(id: string) {
    deleteTimeEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

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
        <KpiCard
          label="Heute"
          value={fmtH(todayMins)}
          sublabel="von 8h Soll"
          progress={todayMins / TARGET_DAY_MINS}
        />
        <KpiCard
          label="Diese Woche"
          value={fmtH(weekMins)}
          sublabel="von 40h Soll"
          progress={weekMins / TARGET_WEEK_MINS}
        />
        <KpiCard
          label="Überstunden"
          value={overtimeStr}
          sublabel={`Saldo ${format(today, 'MMMM', { locale: de })}`}
          progress={Math.min(1, Math.abs(overtimeMins) / TARGET_WEEK_MINS)}
        />
        <KpiCard
          label="Offene Timer"
          value={String(openCount)}
          sublabel={openCount === 0 ? 'Keine laufenden' : `${openCount} laufend`}
          progress={0}
        />
      </div>

      <NewEntryCard onSaved={handleSaved} />

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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {editingEntry && (
        <EditEntryDrawer
          entry={editingEntry}
          onSave={handleSave}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </main>
  )
}
