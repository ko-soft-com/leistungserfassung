import { describe, it, expect } from 'vitest'
import { exportToCsv, importFromCsv } from './csv'
import type { Eintrag } from '../types/entry'

const baseEntry: Eintrag = {
  id: 'test-id',
  createdAt: 1000,
  datum: '2026-05-11',
  startzeit: '09:00',
  endzeit: '10:00',
  auftraggeber: 'Kunde A',
  auftragsnummer: 'K-001',
  auftrag: 'Projekt X',
  zeitkonto: 'Entwicklung',
  aufgabe: 'Implementierung',
  dauer: { stunden: 1, minuten: 0 },
  beschreibung: 'Beschreibungstext',
  externeId: 'EXT-1',
  jiraTicket: 'PROJ-42',
  prLink: 'https://github.com/org/repo/pull/1',
}

describe('exportToCsv', () => {
  it('returns only header when array is empty', () => {
    const result = exportToCsv([])
    const lines = result.replace('﻿', '').split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink')
  })

  it('starts with UTF-8 BOM', () => {
    expect(exportToCsv([])).toMatch(/^﻿/)
  })

  it('produces one data row for one entry', () => {
    const result = exportToCsv([baseEntry])
    const lines = result.replace('﻿', '').split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('2026-05-11,09:00,10:00,Kunde A,K-001,Projekt X,Entwicklung,Implementierung,1,0,Beschreibungstext,EXT-1,PROJ-42,https://github.com/org/repo/pull/1')
  })

  it('renders empty string for absent optional fields', () => {
    const minimal: Eintrag = { ...baseEntry, startzeit: undefined, endzeit: undefined, beschreibung: undefined, externeId: undefined, jiraTicket: undefined, prLink: undefined }
    const result = exportToCsv([minimal])
    const row = result.replace('﻿', '').split('\n')[1]
    expect(row).toBe('2026-05-11,,,Kunde A,K-001,Projekt X,Entwicklung,Implementierung,1,0,,,,')
  })

  it('quotes fields that contain a comma', () => {
    const entry: Eintrag = { ...baseEntry, auftraggeber: 'Firma, GmbH' }
    const row = exportToCsv([entry]).replace('﻿', '').split('\n')[1]
    expect(row).toContain('"Firma, GmbH"')
  })

  it('doubles quotes inside quoted fields', () => {
    const entry: Eintrag = { ...baseEntry, auftraggeber: 'Say "Hello"' }
    const row = exportToCsv([entry]).replace('﻿', '').split('\n')[1]
    expect(row).toContain('"Say ""Hello"""')
  })
})

describe('importFromCsv', () => {
  it('returns empty result for empty string', () => {
    expect(importFromCsv('')).toEqual({ imported: [], skipped: 0 })
  })

  it('returns empty result for header-only CSV', () => {
    const header = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink'
    expect(importFromCsv(header)).toEqual({ imported: [], skipped: 0 })
  })

  it('imports a valid row', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,09:00,10:00,Kunde A,K-001,Projekt X,Entwicklung,Implementierung,1,0,Beschreibungstext,EXT-1,PROJ-42,https://github.com/org/repo/pull/1'
    const { imported, skipped } = importFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0]).toMatchObject({
      datum: '2026-05-11',
      auftraggeber: 'Kunde A',
      dauer: { stunden: 1, minuten: 0 },
    })
  })

  it('skips row with missing required field (empty auftraggeber)', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,,K-001,Projekt X,Entwicklung,Impl,1,0,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('skips row with non-numeric stunden', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,abc,0,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('maps empty optional fields to undefined', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,1,0,,,,\n'
    const { imported } = importFromCsv(csv)
    expect(imported[0].startzeit).toBeUndefined()
    expect(imported[0].beschreibung).toBeUndefined()
    expect(imported[0].prLink).toBeUndefined()
  })

  it('strips UTF-8 BOM', () => {
    const csv = '﻿datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,1,0,,,,\n'
    const { imported } = importFromCsv(csv)
    expect(imported).toHaveLength(1)
  })

  it('round-trips export → import', () => {
    const { imported } = importFromCsv(exportToCsv([baseEntry]))
    expect(imported).toHaveLength(1)
    expect(imported[0].auftraggeber).toBe(baseEntry.auftraggeber)
    expect(imported[0].dauer).toEqual(baseEntry.dauer)
    expect(imported[0].prLink).toBe(baseEntry.prLink)
  })

  it('round-trips entry with comma in field', () => {
    const entry: Eintrag = { ...baseEntry, auftraggeber: 'Firma, GmbH' }
    const { imported } = importFromCsv(exportToCsv([entry]))
    expect(imported[0].auftraggeber).toBe('Firma, GmbH')
  })

  it('skips row with negative stunden', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,-1,0,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('skips row with fractional minuten', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,1,1.5,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('skips row with empty stunden', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,,0,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })
})
