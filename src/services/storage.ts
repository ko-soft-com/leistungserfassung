import type { Eintrag, EintragFormData, TimeEntry } from '../types/entry'

const STORAGE_KEY = 'leistungserfassung_eintraege'

export function getEintraege(): Eintrag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Eintrag[]
    return parsed.sort((a, b) => b.datum.localeCompare(a.datum))
  } catch {
    return []
  }
}

export function saveEintrag(data: EintragFormData): Eintrag {
  const entries = getEintraege()
  const newEntry: Eintrag = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...entries, newEntry]))
  return newEntry
}

export function updateEintrag(id: string, data: EintragFormData): Eintrag | null {
  const entries = getEintraege()
  const index = entries.findIndex((e) => e.id === id)
  if (index === -1) return null
  const updated: Eintrag = { ...entries[index], ...data }
  entries[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return updated
}

export function deleteEintrag(id: string): void {
  const entries = getEintraege().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// ── V2 Time Entries ────────────────────────────────────────────────────────────

const TIME_ENTRIES_KEY = 'leistungserfassung_time_entries'

export function getTimeEntries(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(TIME_ENTRIES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TimeEntry[]
  } catch {
    return []
  }
}

export function saveTimeEntry(
  data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>
): TimeEntry {
  const entries = getTimeEntries()
  const now = new Date().toISOString()
  const entry: TimeEntry = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify([...entries, entry]))
  return entry
}
