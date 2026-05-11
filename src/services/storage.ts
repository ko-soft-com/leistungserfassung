import type { Eintrag, EintragFormData } from '../types/entry'

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
