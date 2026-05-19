# JSON Backup Export/Import — Design Spec

## Goal

Add JSON export and import alongside the existing CSV export/import so that Gleitzeit day records (workStart, workEnd, pauseMinutes) are included in backups. CSV export remains unchanged.

## Background

The Gleitzeit presence bar (DayPresenceRow) stores per-day arrival/departure/pause data in `localStorage` via `src/services/dayRecords.ts`. The existing CSV export only covers `TimeEntry` records; day records are silently omitted. A JSON backup format can carry both data sets in one file.

## Data Format

File name: `leistungserfassung-backup-YYYY-MM-DD.json`

```json
{
  "version": 1,
  "exportedAt": "2026-05-19T10:00:00.000Z",
  "entries": [
    {
      "id": "abc123",
      "date": "2026-05-19",
      "start": "08:00",
      "end": "09:30",
      "client": "WASCOSA",
      "orderNo": "SP 07",
      "account": "#WX-225",
      "task": "Feature",
      "description": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "dayRecords": {
    "2026-05-19": {
      "date": "2026-05-19",
      "workStart": "08:00",
      "workEnd": "17:00",
      "pauseMinutes": 30
    }
  }
}
```

- `version` is always `1` for this initial format; import must reject files without it.
- `entries` is a `TimeEntry[]` — the full stored shape including `id`, `createdAt`, `updatedAt`.
- `dayRecords` is a `Record<string, DayRecord>` keyed by `YYYY-MM-DD`.
- Both arrays/objects may be empty; the file is still valid.

## Architecture

### `src/utils/backup.ts` (new)

Two pure functions, no side effects:

```ts
exportToJson(entries: TimeEntry[], dayRecords: Record<string, DayRecord>): string
```
Returns a formatted JSON string with `version`, `exportedAt` (ISO timestamp), `entries`, `dayRecords`.

```ts
importFromJson(text: string): { entries: TimeEntry[]; dayRecords: Record<string, DayRecord> }
```
Parses `text`, validates presence of `version` field. Throws `Error` with a German message on any parse or validation failure. Does **not** write to storage — caller is responsible.

### `ErfassungPage.tsx` (modified)

**Export handler** (`handleJsonExport`):
- Calls `exportToJson(entries, getAllDayRecords())` — needs `getAllDayRecords` exported from `src/services/dayRecords.ts`.
- Triggers download of `leistungserfassung-backup-YYYY-MM-DD.json`.
- Sets `csvMessage` to `"Backup exportiert (N Einträge, M Tageszeiten)."`.

**Import handler** (`handleJsonFileChange`):
- Reads file via `FileReader`.
- Calls `importFromJson(text)` — on error sets `csvMessage` to the error message.
- **Entries merge:** runs `isDuplicate` against current entries; saves only non-duplicates via `saveTimeEntry`.
- **Day records merge:** calls `saveDayRecord` for each imported day record; existing records for that date are overwritten by the imported value (last-write-wins per date).
- Updates `setEntries(getTimeEntries())` after import.
- Sets feedback message: `"Backup importiert: N Einträge, M Tageszeiten."` (with duplicate/skipped counts if relevant).

**New hidden file input** for `.json` files alongside the existing CSV file input.

**Two new buttons** placed to the right of "CSV importieren":
- "JSON exportieren"
- "JSON importieren"

### `src/services/dayRecords.ts` (modified)

Export a new function:
```ts
getAllDayRecords(): Record<string, DayRecord>
```
Returns the full map from localStorage (same internal `getAll()` already exists — just expose it).

## Import Merge Rules

| Data | Rule |
|------|------|
| TimeEntry | Skip if `isDuplicate(entry, currentEntries)` — same logic as CSV import |
| DayRecord | Overwrite per date — imported value replaces existing value for that date |

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| File not valid JSON | `csvMessage`: "Die Datei ist kein gültiges JSON." |
| Missing `version` field | `csvMessage`: "Unbekanntes Backup-Format (kein version-Feld)." |
| Empty entries + empty dayRecords | `csvMessage`: "Backup enthält keine Daten." |
| FileReader error | `csvMessage`: "Fehler beim Lesen der Datei." |

## Testing

`src/utils/backup.test.ts`:
- `exportToJson` produces valid JSON with correct shape
- `exportToJson` with empty inputs produces `entries: []` and `dayRecords: {}`
- `importFromJson` round-trips an export
- `importFromJson` throws on invalid JSON string
- `importFromJson` throws when `version` field is missing
- `importFromJson` returns empty collections for empty arrays/objects

## Out of Scope

- No format migration (version 1 only)
- No validation of individual entry field values during import (trust the backup file)
- CSV export/import unchanged
