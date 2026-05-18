import { Search } from 'lucide-react'
import SegmentedControl from '../../components/SegmentedControl'
import type { Range } from '../../data/filter'
import styles from './Toolbar.module.css'

const RANGE_OPTIONS = [
  { label: 'Heute', value: 'today' },
  { label: 'Woche', value: 'week' },
  { label: 'Monat', value: 'month' },
  { label: 'Alle', value: 'all' },
  { label: 'Eigener Zeitraum', value: 'custom' },
]

interface ToolbarProps {
  range: Range
  onRangeChange: (r: Range) => void
  search: string
  onSearchChange: (v: string) => void
  clients: string[]
  selectedClient: string | null
  onClientChange: (c: string | null) => void
}

export default function Toolbar({ range, onRangeChange, search, onSearchChange, clients, selectedClient, onClientChange }: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={range}
        onChange={v => onRangeChange(v as Range)}
      />

      <label className={styles.searchLabel}>
        <Search size={13} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          aria-label="Filter nach Auftrag, JIRA, Beschreibung"
          className={styles.searchInput}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Filter nach Auftrag, JIRA, Beschreibung…"
        />
      </label>

      {clients.length > 0 && (
        <select
          className={styles.clientSelect}
          value={selectedClient ?? ''}
          onChange={e => onClientChange(e.target.value || null)}
          aria-label="Auftraggeber filtern"
        >
          <option value="">Alle Auftraggeber</option>
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}
    </div>
  )
}
