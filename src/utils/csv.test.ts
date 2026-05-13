import { describe, it, expect } from 'vitest'
import { exportToCsv, importFromCsv, exportTimeEntriesToCsv, importTimeEntriesFromCsv } from './csv'
import type { Eintrag, TimeEntry } from '../types/entry'

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

  it('skips row with minuten greater than 59', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,Aufgabe,1,90,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('imports row with empty aufgabe', () => {
    const csv = 'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n2026-05-11,,,Kunde A,K-001,Projekt X,Zeitkonto,,1,0,,,,\n'
    const { imported, skipped } = importFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].aufgabe).toBe('')
  })
})

// ── TimeEntry CSV ──────────────────────────────────────────────────────────────

const baseTimeEntry: TimeEntry = {
  id: 'te-1',
  date: '2026-05-12',
  start: '09:00',
  end: '10:30',
  client: 'Kunde B',
  orderNo: 'B-002',
  account: 'Entwicklung',
  task: 'Feature',
  description: 'Login implementieren',
  externalId: 'EXT-2',
  jira: 'LEIS-42',
  pr: 'https://github.com/org/repo/pull/7',
  createdAt: '2026-05-12T09:00:00.000Z',
  updatedAt: '2026-05-12T10:30:00.000Z',
}

describe('exportTimeEntriesToCsv', () => {
  it('returns only header when array is empty', () => {
    const result = exportTimeEntriesToCsv([])
    const lines = result.replace('﻿', '').split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe(
      'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr'
    )
  })

  it('starts with UTF-8 BOM', () => {
    expect(exportTimeEntriesToCsv([])).toMatch(/^﻿/)
  })

  it('produces one data row for one entry', () => {
    const result = exportTimeEntriesToCsv([baseTimeEntry])
    const lines = result.replace('﻿', '').split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe(
      '2026-05-12,09:00,10:30,Kunde B,B-002,Entwicklung,Feature,1,30,Login implementieren,EXT-2,LEIS-42,https://github.com/org/repo/pull/7'
    )
  })

  it('renders empty string for null end and absent optional fields', () => {
    const entry: TimeEntry = { ...baseTimeEntry, end: null, externalId: undefined, jira: undefined, pr: undefined }
    const row = exportTimeEntriesToCsv([entry]).replace('﻿', '').split('\n')[1]
    expect(row).toBe('2026-05-12,09:00,,Kunde B,B-002,Entwicklung,Feature,0,0,Login implementieren,,,')
  })

  it('quotes fields that contain a comma', () => {
    const entry: TimeEntry = { ...baseTimeEntry, client: 'Firma, GmbH' }
    const row = exportTimeEntriesToCsv([entry]).replace('﻿', '').split('\n')[1]
    expect(row).toContain('"Firma, GmbH"')
  })

  it('computes hours and minutes from start and end', () => {
    // 08:00 → 09:45 = 105 min = 1h45m
    const entry = { ...baseTimeEntry, start: '08:00', end: '09:45' }
    const row = exportTimeEntriesToCsv([entry]).replace('﻿', '').split('\n')[1]
    const cols = row.split(',')
    expect(cols[7]).toBe('1')
    expect(cols[8]).toBe('45')
  })

  it('computes duration for midnight-crossing entries', () => {
    // 23:00 → 01:00 = 120 min = 2h0m
    const entry = { ...baseTimeEntry, start: '23:00', end: '01:00' }
    const row = exportTimeEntriesToCsv([entry]).replace('﻿', '').split('\n')[1]
    const cols = row.split(',')
    expect(cols[7]).toBe('2')
    expect(cols[8]).toBe('0')
  })

  it('computes zero minutes for exact-hour durations', () => {
    // 08:00 → 09:00 = 60 min = 1h0m
    const entry = { ...baseTimeEntry, start: '08:00', end: '09:00' }
    const row = exportTimeEntriesToCsv([entry]).replace('﻿', '').split('\n')[1]
    const cols = row.split(',')
    expect(cols[7]).toBe('1')
    expect(cols[8]).toBe('0')
  })
})

describe('importTimeEntriesFromCsv', () => {
  it('returns empty result for empty string', () => {
    expect(importTimeEntriesFromCsv('')).toEqual({ imported: [], skipped: 0 })
  })

  it('returns empty result for header-only CSV', () => {
    const header = 'date,start,end,client,orderNo,account,task,description,externalId,jira,pr'
    expect(importTimeEntriesFromCsv(header)).toEqual({ imported: [], skipped: 0 })
  })

  it('imports a valid row', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,10:30,Kunde B,B-002,Entwicklung,Feature,Login implementieren,EXT-2,LEIS-42,https://github.com/org/repo/pull/7'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0]).toMatchObject({
      date: '2026-05-12',
      start: '09:00',
      end: '10:30',
      client: 'Kunde B',
      task: 'Feature',
    })
  })

  it('maps empty end to null', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,Feature,Beschreibung,,,\n'
    const { imported } = importTimeEntriesFromCsv(csv)
    expect(imported[0].end).toBeNull()
  })

  it('maps empty optional fields to undefined', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,Feature,Beschreibung,,,\n'
    const { imported } = importTimeEntriesFromCsv(csv)
    expect(imported[0].externalId).toBeUndefined()
    expect(imported[0].jira).toBeUndefined()
    expect(imported[0].pr).toBeUndefined()
  })

  it('skips row with missing required field (empty client)', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,,B-002,Entwicklung,Feature,Beschreibung,,,\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(imported).toHaveLength(0)
    expect(skipped).toBe(1)
  })

  it('imports row with any task string (task is freetext)', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,InvalidTask,Beschreibung,,,\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(imported).toHaveLength(1)
    expect(skipped).toBe(0)
    expect(imported[0].task).toBe('InvalidTask')
  })

  it('strips UTF-8 BOM', () => {
    const csv =
      '﻿date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,10:30,Kunde B,B-002,Entwicklung,Feature,Beschreibung,,,\n'
    const { imported } = importTimeEntriesFromCsv(csv)
    expect(imported).toHaveLength(1)
  })

  it('round-trips export → import', () => {
    const { imported } = importTimeEntriesFromCsv(exportTimeEntriesToCsv([baseTimeEntry]))
    expect(imported).toHaveLength(1)
    expect(imported[0].client).toBe(baseTimeEntry.client)
    expect(imported[0].task).toBe(baseTimeEntry.task)
    expect(imported[0].jira).toBe(baseTimeEntry.jira)
    expect(imported[0].end).toBe(baseTimeEntry.end)
  })

  it('imports row with empty task string', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,,Beschreibung,,,\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(imported).toHaveLength(1)
    expect(skipped).toBe(0)
    expect(imported[0].task).toBe('')
  })

  it('imports correctly when columns are in a different order', () => {
    // description and pr swapped relative to canonical order
    const csv =
      'date,start,end,client,orderNo,account,task,pr,externalId,jira,description\n' +
      '2026-05-12,09:00,10:30,Kunde B,B-002,Entwicklung,Feature,https://github.com/org/repo/pull/7,EXT-2,LEIS-42,Login implementieren\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].description).toBe('Login implementieren')
    expect(imported[0].pr).toBe('https://github.com/org/repo/pull/7')
    expect(imported[0].externalId).toBe('EXT-2')
    expect(imported[0].jira).toBe('LEIS-42')
  })

  it('imports correctly when optional columns are absent from header', () => {
    // Only required + description, no externalId/jira/pr columns at all
    const csv =
      'date,start,end,client,orderNo,account,task,description\n' +
      '2026-05-12,09:00,10:30,Kunde B,B-002,Entwicklung,Feature,Login implementieren\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].description).toBe('Login implementieren')
    expect(imported[0].externalId).toBeUndefined()
    expect(imported[0].jira).toBeUndefined()
    expect(imported[0].pr).toBeUndefined()
  })

  it('imports a V1 German-header CSV', () => {
    const csv =
      'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n' +
      '2026-05-12,09:00,10:30,Kunde B,B-002,Auftrag,Entwicklung,Feature,1,30,Login implementieren,EXT-2,LEIS-42,https://github.com/org/repo/pull/7\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].client).toBe('Kunde B')
    expect(imported[0].account).toBe('Entwicklung')
    expect(imported[0].task).toBe('Feature')
    expect(imported[0].description).toBe('Login implementieren')
    expect(imported[0].end).toBe('10:30')
    expect(imported[0].jira).toBe('LEIS-42')
    expect(imported[0].orderNo).toBe('B-002')
  })

  it('computes end from hours/minutes when end is absent', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,Feature,1,30,Login implementieren,,,\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].end).toBe('10:30')
  })

  it('leaves end as null when both end and duration are absent', () => {
    const csv =
      'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Entwicklung,Feature,0,0,Login implementieren,,,\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].end).toBeNull()
  })

  it('computes end from stunden/minuten when endzeit is absent in V1 CSV', () => {
    const csv =
      'datum,startzeit,endzeit,auftraggeber,auftragsnummer,auftrag,zeitkonto,aufgabe,stunden,minuten,beschreibung,externeId,jiraTicket,prLink\n' +
      '2026-05-12,09:00,,Kunde B,B-002,Auftrag,Entwicklung,Feature,1,30,Login implementieren,EXT-2,LEIS-42,https://github.com/org/repo/pull/7\n'
    const { imported, skipped } = importTimeEntriesFromCsv(csv)
    expect(skipped).toBe(0)
    expect(imported).toHaveLength(1)
    expect(imported[0].end).toBe('10:30')
  })
})
