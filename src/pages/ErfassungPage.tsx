import { useEffect, useMemo, useRef, useState } from 'react'
import { format, getISOWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download, Upload } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import Button from '../components/Button'
import NewEntryCard from '../features/new-entry/NewEntryCard'
import Toolbar from '../features/filters/Toolbar'
import EntryTable from '../features/entry-list/EntryTable'
import EditEntryDrawer from '../features/entry-list/EditEntryDrawer'
import { applyFilter, localISO } from '../data/filter'
import { durationMinutes, fmtH } from '../data/format'
import type { Range } from '../data/filter'
import { getTimeEntries, saveTimeEntry, updateTimeEntry, deleteTimeEntry } from '../services/firestoreTimeEntries'
import { exportTimeEntriesToCsv, importTimeEntriesFromCsv } from '../utils/csv'
import { exportToJson, importFromJson } from '../utils/backup'
import { getAllDayRecords, saveDayRecord, migrateDayRecord } from '../services/firestoreDayRecords'
import { isDuplicate } from '../utils/dedup'
import { getLastUsed, setLastUsed } from '../features/new-entry/suggestions'
import { useToastStore } from '../stores/toast'
import type { TimeEntry } from '../types/entry'
import type { DayRecord } from '../types/dayRecord'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'
import HelpDialog from '../components/HelpDialog'
import styles from './ErfassungPage.module.css'

const byDateDesc = (a: TimeEntry, b: TimeEntry): number => {
  const dateDiff = b.date.localeCompare(a.date)
  if (dateDiff !== 0) return dateDiff
  if (a.start && b.start) return b.start.localeCompare(a.start)
  if (a.start) return 1
  if (b.start) return -1
  return b.createdAt.localeCompare(a.createdAt)
}


export default function ErfassungPage() {
  const today = new Date()
  const kw = getISOWeek(today)
  const weekday = format(today, 'EEEE', { locale: de })
  const dateStr = format(today, 'dd.MM.yyyy')

  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>('week')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [csvMessage, setCsvMessage] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; entry: TimeEntry; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    Promise.all([getTimeEntries(), getAllDayRecords()]).then(([loaded, records]) => {
      setEntries(loaded)
      setDayRecords(records)
      setIsLoading(false)
      if (loaded.length > 0) {
        const current = getLastUsed()
        if (!current.client && !current.orderNo && !current.account) {
          const recent = loaded[0]
          setLastUsed({ client: recent.client, orderNo: recent.orderNo, account: recent.account })
        }
      }
    }).catch(() => {
      setLoadError('Einträge konnten nicht geladen werden.')
      setIsLoading(false)
    })
  }, [])

  const addToast = useToastStore(s => s.addToast)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonFileInputRef = useRef<HTMLInputElement>(null)

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
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const { imported, skipped: formatSkipped } = importTimeEntriesFromCsv(text)
      const currentEntries = await getTimeEntries()
      let dupSkipped = 0
      const toImport = imported.filter((data) => {
        if (isDuplicate(data, currentEntries)) {
          dupSkipped++
          return false
        }
        return true
      })
      const savedEntries = await Promise.all(toImport.map((data) => saveTimeEntry(data)))
      if (toImport.length > 0) {
        setEntries(prev => [...savedEntries, ...prev].sort(byDateDesc))
        const newest = [...toImport].sort((a, b) => b.date.localeCompare(a.date))[0]
        setLastUsed({ client: newest.client, orderNo: newest.orderNo, account: newest.account })
      }

      const parts: string[] = []
      if (toImport.length > 0) parts.push(`${toImport.length} Einträge importiert`)
      if (formatSkipped > 0) parts.push(`${formatSkipped} ungültige Zeilen`)

      if (toImport.length === 0 && dupSkipped > 0) {
        setRange('all')
        setCsvMessage(`${dupSkipped} ${dupSkipped === 1 ? 'Eintrag' : 'Einträge'} bereits vorhanden — alle Einträge werden jetzt angezeigt.`)
      } else {
        if (dupSkipped > 0) parts.push(`${dupSkipped} Duplikate übersprungen`)
        if (parts.length === 0) {
          setCsvMessage('Die Datei enthält keine neuen Einträge.')
        } else {
          setCsvMessage(parts.join(', ') + '.')
        }
      }
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  const handleJsonExport = async () => {
    setCsvMessage(null)
    const dayRecords = await getAllDayRecords()
    if (entries.length === 0 && Object.keys(dayRecords).length === 0) return
    const json = exportToJson(entries, dayRecords)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const exportDate = new Date().toISOString().split('T')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `leistungserfassung-backup-${exportDate}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    const dayCount = Object.keys(dayRecords).length
    setCsvMessage(`Backup exportiert (${entries.length} Einträge, ${dayCount} Tageszeiten).`)
  }

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvMessage(null)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onerror = () => setCsvMessage('Fehler beim Lesen der Datei.')
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string
        const { entries: importedEntries, dayRecords: importedDayRecords } = importFromJson(text)
        const currentEntries = await getTimeEntries()
        let dupSkipped = 0
        const toImport = importedEntries.filter((data) => {
          if (isDuplicate(data, currentEntries)) {
            dupSkipped++
            return false
          }
          return true
        })
        const savedEntries = await Promise.all(
          toImport.map(({ id: _id, createdAt: _c, updatedAt: _u, ...data }) => saveTimeEntry(data)),
        )
        await Promise.all(
          Object.entries(importedDayRecords).map(([date, record]) => {
            const migrated = migrateDayRecord({ ...record, date })
            const { date: _date, ...rest } = migrated
            return saveDayRecord(date, rest)
          })
        )
        if (toImport.length > 0) {
          setEntries(prev => [...savedEntries, ...prev].sort(byDateDesc))
          const newest = [...toImport].sort((a, b) => b.date.localeCompare(a.date))[0]
          setLastUsed({ client: newest.client, orderNo: newest.orderNo, account: newest.account })
        }
        if (toImport.length === 0 && dupSkipped > 0) {
          setRange('all')
        }
        const dayCount = Object.keys(importedDayRecords).length
        const parts: string[] = []
        if (toImport.length > 0) parts.push(`${toImport.length} Einträge`)
        if (dayCount > 0) parts.push(`${dayCount} Tageszeiten`)
        if (dupSkipped > 0) parts.push(`${dupSkipped} Duplikate übersprungen`)
        setCsvMessage(
          parts.length > 0
            ? `Backup importiert: ${parts.join(', ')}.`
            : 'Backup enthält keine neuen Daten.'
        )
      } catch (err) {
        setCsvMessage(err instanceof Error ? err.message : 'Die Datei konnte nicht importiert werden.')
      }
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  // ── KPI computation ────────────────────────────────────────────────────────
  const todayStr = localISO(today)
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    return localISO(d)
  }), [])
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

  async function handleSave(updated: TimeEntry) {
    const { id, createdAt, updatedAt: _u, ...editableFields } = updated
    try {
      await updateTimeEntry(id, editableFields)
      const now = new Date().toISOString()
      setEntries(prev => prev.map(e => e.id === id ? { ...updated, updatedAt: now } : e))
      setEditingEntry(null)
      addToast('success', 'Eintrag aktualisiert.')
    } catch (err) {
      console.error('[handleSave] updateTimeEntry failed:', err)
      addToast('error', 'Fehler beim Speichern. Bitte erneut versuchen.')
    }
  }

  async function handleDuplicate(id: string) {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    const newEntry = await saveTimeEntry({
      client: entry.client,
      orderNo: entry.orderNo,
      account: entry.account,
      task: entry.task,
      description: entry.description,
      externalId: entry.externalId,
      jira: entry.jira,
      pr: entry.pr,
      date: localISO(new Date()),
      start: null,
      end: null,
    })
    setEntries(prev => [newEntry, ...prev].sort(byDateDesc))
  }

  async function handleDelete(id: string) {
    if (pendingDelete) {
      clearTimeout(pendingDelete.timer)
      await deleteTimeEntry(pendingDelete.id)
      setPendingDelete(null)
    }
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setEntries(prev => prev.filter(e => e.id !== id))
    const timer = setTimeout(() => {
      deleteTimeEntry(id).then(() => setPendingDelete(null))
    }, 5000)
    setPendingDelete({ id, entry, timer })
  }

  function handleUndoDelete() {
    if (!pendingDelete) return
    clearTimeout(pendingDelete.timer)
    setEntries(prev => [...prev, pendingDelete.entry].sort(byDateDesc))
    setPendingDelete(null)
  }

  const pendingDeleteRef = useRef(pendingDelete)
  pendingDeleteRef.current = pendingDelete
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timer)
        void deleteTimeEntry(pendingDeleteRef.current.id)
      }
    }
  }, [])

  useGlobalShortcuts({
    onFocusNew: () => {
      const input = document.getElementById('auftraggeber') as HTMLInputElement | null
      input?.focus()
    },
    onFocusSearch: () => {
      const input = document.querySelector<HTMLInputElement>('[aria-label="Filter nach Auftrag, JIRA, Beschreibung"]')
      input?.focus()
    },
    onToggleHelp: () => setShowHelp(prev => !prev),
  })

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
          <Button variant="secondary" onClick={handleJsonExport}>
            <Download size={14} /> JSON exportieren
          </Button>
          <Button variant="secondary" onClick={() => jsonFileInputRef.current?.click()}>
            <Upload size={14} /> JSON importieren
          </Button>
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json"
            aria-label="JSON-Backup importieren"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={handleJsonFileChange}
          />
          {pendingDelete && (
            <span role="status" aria-live="polite" style={{ fontSize: '0.875rem', color: 'var(--clr-text-sec)' }}>
              Eintrag gelöscht.{' '}
              <button
                type="button"
                onClick={handleUndoDelete}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}
              >
                Rückgängig
              </button>
            </span>
          )}
          {!pendingDelete && csvMessage && (
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

      {isLoading && <p style={{ margin: '0.5rem 0' }}>Laden…</p>}
      {loadError && (
        <p role="alert" className={styles.loadError}>
          {loadError}
        </p>
      )}

      <NewEntryCard onSaved={handleSaved} entries={entries} />

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
        onDuplicate={handleDuplicate}
        dayRecords={dayRecords}
        onDayRecordChange={(record) => setDayRecords(prev => ({ ...prev, [record.date]: record }))}
        visibleDates={isLoading ? [] : last7Days}
      />

      {editingEntry && (
        <EditEntryDrawer
          entry={editingEntry}
          entries={entries}
          onSave={handleSave}
          onClose={() => setEditingEntry(null)}
        />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </main>
  )
}
