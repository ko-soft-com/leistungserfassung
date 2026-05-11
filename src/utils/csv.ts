import type { Eintrag, EintragFormData } from '../types/entry'

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

    if (!datum || !auftraggeber || !auftragsnummer || !auftrag || !zeitkonto || !aufgabe) {
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
