import { useUIStore } from '../../stores/ui'
import { durationMinutes } from '../../data/format'
import type { TimeEntry } from '../../types/entry'
import DayGroupHeader from './DayGroupHeader'
import EntryRow from './EntryRow'
import styles from './EntryTable.module.css'

interface EntryTableProps {
  entries: TimeEntry[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate?: (id: string) => void
}

function groupByDate(entries: TimeEntry[]): [string, TimeEntry[]][] {
  const map = new Map<string, TimeEntry[]>()
  for (const e of entries) {
    const arr = map.get(e.date) ?? []
    arr.push(e)
    map.set(e.date, arr)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

function isEntryIncomplete(e: TimeEntry): boolean {
  return !e.start || !e.end || !e.client || !e.orderNo || !e.account || !e.description
}

export default function EntryTable({ entries, onEdit, onDelete, onDuplicate }: EntryTableProps) {
  const { collapsedDays, toggleDay } = useUIStore()

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Noch keine Zeiten erfasst</p>
      </div>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className={styles.container}>
      {groups.map(([date, dayEntries]) => {
        const totalMins = dayEntries.reduce((s, e) => s + durationMinutes(e), 0)
        const isCollapsed = collapsedDays.includes(date)
        return (
          <div key={date}>
            <DayGroupHeader
              date={date}
              entryCount={dayEntries.length}
              totalMinutes={totalMins}
              isCollapsed={isCollapsed}
              onToggle={() => toggleDay(date)}
            />
            <div id={`day-${date}`} hidden={isCollapsed}>
              {dayEntries.map(e => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  isIncomplete={isEntryIncomplete(e)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
