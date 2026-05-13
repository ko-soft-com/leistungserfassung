import { useRef, useState } from 'react'
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
import { getTimeEntries, saveTimeEntry, updateTimeEntry, deleteTimeEntry } from '../services/storage'
import { exportTimeEntriesToCsv, importTimeEntriesFromCsv } from '../utils/csv'
import { isDuplicate } from '../utils/dedup'
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
  const [csvMessage, setCsvMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    setCsvMessage(null)
    if (entries.length === 0) return
    const csv = exportTimeEntriesToCsv(entries)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const exportDate = new Date().toISOString().split('T')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `leistungserfassung-${exportDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    setCsvMessage(`${entries.length} Einträge exportiert.`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvMessage(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onerror = () => setCsvMessage('Fehler beim Lesen der Datei.')
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { imported, skipped: formatSkipped } = importTimeEntriesFromCsv(text)
      const currentEntries = getTimeEntries()
      let dupSkipped = 0
      const toImport = imported.filter((data) => {
        if (isDuplicate(data, currentEntries)) {
          dupSkipped++
          return false
        }
        return true
      })
      toImport.forEach((data) => saveTimeEntry(data))
      if (toImport.length > 0) setEntries(getTimeEntries())

      const parts: string[] = []
      if (toImport.length > 0) parts.push(`${toImport.length} Einträge importiert`)
      if (dupSkipped > 0) parts.push(`${dupSkipped} Duplikate übersprungen`)
      if (formatSkipped > 0) parts.push(`${formatSkipped} ungültige Zeilen`)
      if (parts.length === 0) {
        setCsvMessage('Die Datei enthält keine neuen Einträge.')
      } else {
        setCsvMessage(parts.join(', ') + '.')
      }
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

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
    const stored = updateTimeEntry(updated.id, updated)
    if (stored) {
      setEntries(prev => prev.map(e => e.id === updated.id ? stored : e))
      setEditingEntry(null)
    }
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
          <Button variant="secondary" onClick={handleExport}>
            <Download size={14} /> CSV exportieren
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> CSV importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            aria-label="CSV-Datei importieren"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={handleFileChange}
          />
          {csvMessage && (
            <span role="status" aria-live="polite" style={{ fontSize: '0.875rem', color: 'var(--clr-text-sec)' }}>
              {csvMessage}
            </span>
          )}
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
