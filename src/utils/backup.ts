import type { TimeEntry } from '../types/entry'
import type { DayRecord } from '../types/dayRecord'

interface BackupFile {
  version: number
  exportedAt: string
  entries: TimeEntry[]
  dayRecords: Record<string, DayRecord>
}

export function exportToJson(
  entries: TimeEntry[],
  dayRecords: Record<string, DayRecord>
): string {
  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    dayRecords,
  }
  return JSON.stringify(backup, null, 2)
}

export function importFromJson(text: string): {
  entries: TimeEntry[]
  dayRecords: Record<string, DayRecord>
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    throw new Error('Unbekanntes Backup-Format (kein version-Feld).')
  }
  const backup = parsed as BackupFile
  return {
    entries: backup.entries ?? [],
    dayRecords: backup.dayRecords ?? {},
  }
}
