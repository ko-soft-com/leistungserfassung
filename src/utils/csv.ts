import type { Eintrag, EintragFormData, TimeEntry } from '../types/entry'

const HEADERS = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink'

function escapeField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export function exportToCsv(eintraege: Eintrag[]): string {
  const rows = eintraege.map((e) =>
    [
      e.datum,
      e.startzeit ?? '',
      e.endzeit ?? '',
      e.auftraggeber,
      e.auftragsnummer,
      e.auftrag,
      e.zeitkonto,
      e.aufgabe,
      String(e.dauer.stunden),
      String(e.dauer.minuten),
      e.beschreibung ?? '',
      e.externeId ?? '',
      e.jiraTicket ?? '',
      e.prLink ?? '',
    ]
      .map(escapeField)
      .join(',')
  )
  return '﻿' + [HEADERS, ...rows].join('\n')
}

export type ImportResult = {
  imported: EintragFormData[]
  skipped: number
}

export function importFromCsv(csv: string): ImportResult {
  const content = csv.startsWith('﻿') ? csv.slice(1) : csv
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return { imported: [], skipped: 0 }

  let skipped = 0
  const imported: EintragFormData[] = []

  for (const line of lines.slice(1)) {
    const f = parseCsvLine(line)
    if (f.length < 10) {
      skipped++
      continue
    }
    const [datum, startzeit, endzeit, auftraggeber, auftragsnummer, auftrag, zeitkonto, aufgabe, stundenStr, minutenStr, beschreibung, externeId, jiraTicket, prLink] = f

    if (!datum || !auftraggeber || !auftragsnummer || !auftrag || !zeitkonto) {
      skipped++
      continue
    }
    if (!stundenStr.trim() || !minutenStr.trim()) {
      skipped++
      continue
    }
    const stunden = Number(stundenStr)
    const minuten = Number(minutenStr)
    if (!Number.isInteger(stunden) || !Number.isInteger(minuten) || stunden < 0 || minuten < 0 || minuten > 59) {
      skipped++
      continue
    }

    imported.push({
      datum,
      startzeit: startzeit || undefined,
      endzeit: endzeit || undefined,
      auftraggeber,
      auftragsnummer,
      auftrag,
      zeitkonto,
      aufgabe,
      dauer: { stunden, minuten },
      beschreibung: beschreibung || undefined,
      externeId: externeId || undefined,
      jiraTicket: jiraTicket || undefined,
      prLink: prLink || undefined,
    })
  }

  return { imported, skipped }
}

// ── V2 TimeEntry CSV ──────────────────────────────────────────────────────────

function durationParts(start: string | null, end: string | null): { hours: number; minutes: number } {
  if (!start || !end) return { hours: 0, minutes: 0 }
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const rawMinutes = eh * 60 + em - (sh * 60 + sm)
  const total = rawMinutes < 0 ? rawMinutes + 24 * 60 : rawMinutes
  return { hours: Math.floor(total / 60), minutes: total % 60 }
}

const TIME_HEADERS =
  'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr'

export function exportTimeEntriesToCsv(entries: TimeEntry[]): string {
  const rows = entries.map((e) => {
    const { hours, minutes } = durationParts(e.start, e.end)
    return [
      e.date,
      e.start ?? '',
      e.end ?? '',
      e.client,
      e.orderNo,
      e.account,
      e.task,
      String(hours),
      String(minutes),
      e.description,
      e.externalId ?? '',
      e.jira ?? '',
      e.pr ?? '',
    ]
      .map(escapeField)
      .join(',')
  })
  return '﻿' + [TIME_HEADERS, ...rows].join('\n')
}

export type TimeEntryImportResult = {
  imported: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>[]
  skipped: number
}

const V1_ALIASES: Record<string, string> = {
  datum: 'date',
  startzeit: 'start',
  endzeit: 'end',
  auftraggeber: 'client',
  auftragsnummer: 'orderNo',
  zeitkonto: 'account',
  aufgabe: 'task',
  stunden: 'hours',
  minuten: 'minutes',
  beschreibung: 'description',
  externeId: 'externalId',
  jiraTicket: 'jira',
  prLink: 'pr',
  // 'auftrag' (V1 order name) has no V2 equivalent; silently ignored on import
}

export function importTimeEntriesFromCsv(csv: string): TimeEntryImportResult {
  const content = csv.startsWith('﻿') ? csv.slice(1) : csv
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return { imported: [], skipped: 0 }

  const rawCols = parseCsvLine(lines[0])
  const headerCols = rawCols.map((col) => V1_ALIASES[col] ?? col)
  const idx: Record<string, number> = Object.fromEntries(
    headerCols.map((col, i) => [col, i])
  )

  const REQUIRED = ['date', 'client', 'orderNo', 'account'] as const
  if (REQUIRED.some((col) => idx[col] === undefined)) {
    return { imported: [], skipped: 0 }
  }

  const get = (f: string[], col: string): string =>
    idx[col] !== undefined ? (f[idx[col]] ?? '') : ''

  const REQUIRED_MAX_IDX = Math.max(...REQUIRED.map((col) => idx[col]))

  let skipped = 0
  const imported: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>[] = []

  for (const line of lines.slice(1)) {
    const f = parseCsvLine(line)
    if (f.length <= REQUIRED_MAX_IDX) {
      skipped++
      continue
    }

    const date = get(f, 'date')
    const start = get(f, 'start')
    const end = get(f, 'end')
    const client = get(f, 'client')
    const orderNo = get(f, 'orderNo')
    const account = get(f, 'account')
    const task = get(f, 'task')
    const description = get(f, 'description')
    const externalId = get(f, 'externalId')
    const jira = get(f, 'jira')
    const pr = get(f, 'pr')

    const hoursStr = get(f, 'hours')
    const minutesStr = get(f, 'minutes')

    let resolvedEnd = end
    if (!resolvedEnd && start) {
      const h = parseInt(hoursStr, 10)
      const m = parseInt(minutesStr, 10)
      if ((h > 0 || m > 0) && Number.isFinite(h) && Number.isFinite(m)) {
        const [sh, sm] = start.split(':').map(Number)
        const total = sh * 60 + sm + h * 60 + m
        resolvedEnd = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
      }
    }

    if (!date || !client || !orderNo || !account) {
      skipped++
      continue
    }

    imported.push({
      date,
      start: start || null,
      end: resolvedEnd || null,
      client,
      orderNo,
      account,
      task,
      description,
      externalId: externalId || undefined,
      jira: jira || undefined,
      pr: pr || undefined,
    })
  }

  return { imported, skipped }
}
