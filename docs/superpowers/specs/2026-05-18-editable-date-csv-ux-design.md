# Design: Editierbares Datum + CSV-Duplikat-UX

**Datum:** 2026-05-18  
**Status:** Genehmigt

---

## Kontext

Zwei unabhängige Probleme in der Leistungserfassung-App (React/TypeScript, Vite, localStorage):

1. Das Datum eines Eintrags ist weder beim Erstellen noch beim Bearbeiten änderbar — Einträge aus vergangenen Tagen können nicht nachträglich erfasst werden.
2. Der CSV-Import zeigt „Duplikate übersprungen", obwohl die Tabelle leer wirkt — weil der aktive Zeitraum-Filter (z.B. „Diese Woche") ältere, bereits importierte Einträge versteckt.

---

## Feature 1: Editierbares Datum

### Neuer Eintrag (NewEntryCard)

Das statische Datum-Label im Header (`· {format(new Date(), 'dd.MM.yyyy')}`) wird durch ein `<input type="date">` ersetzt, das an `draft.date` in `useDraft` gebunden ist.

- **Standardwert:** Heute (bereits so in `useDraft` initialisiert)
- **Binding:** `setField('date', value)` bei `onChange`
- **Styling:** Inline im Header, minimalistisch — kein separates Field-Wrapper, da es im Titel-Bereich sitzt. Ein schmales `input[type=date]` mit `appearance: none` und passender Schriftfarbe (`--clr-text-sec`).
- **Reset:** Beim `reset()` in `useDraft` wird das Datum wieder auf Heute gesetzt (bereits so implementiert)

### Bestehender Eintrag bearbeiten (EditEntryDrawer)

Ein `<Field id="edit-date" label="Datum" type="date" value={draft.date} onChange={...} />` wird als erstes Feld im Drawer-Body eingefügt (vor Auftraggeber).

- Das `date`-Feld des `TimeEntry`-Typs ist bereits `string` im Format `'YYYY-MM-DD'` — direkt kompatibel mit `input[type=date]`
- `Field` unterstützt `type`-Prop bereits

---

## Feature 2: CSV-Duplikat-UX

### Root Cause

`isDuplicate()` vergleicht gegen `getTimeEntries()` (alle Einträge in localStorage), während die Tabelle nur die gefilterten Einträge (z.B. aktuelle Woche) zeigt. Das ist korrekte Logik — aber für den Nutzer unsichtbar.

### Fix

In `ErfassungPage.handleFileChange`, wenn `toImport.length === 0 && dupSkipped > 0` (alle Einträge waren Duplikate, nichts Neues wurde importiert):

1. `setRange('all')` aufrufen — dadurch werden alle gespeicherten Einträge sichtbar
2. Die Nachricht anpassen: `"X Duplikate übersprungen — Einträge bereits vorhanden. Alle Zeiträume werden jetzt angezeigt."`

Wenn teilweise neue + teilweise Duplikate: kein automatisches Range-Switch, nur die bestehende Nachricht (z.B. „3 Einträge importiert, 2 Duplikate übersprungen.").

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/features/new-entry/NewEntryCard.tsx` | Statisches Datum durch `<input type="date">` ersetzen |
| `src/features/new-entry/NewEntryCard.module.css` | Styling für das Datum-Input |
| `src/features/entry-list/EditEntryDrawer.tsx` | Datum-`<Field>` als erstes Feld einfügen |
| `src/pages/ErfassungPage.tsx` | CSV-Handler: Range-Switch + bessere Meldung bei All-Duplikate |

---

## Tests

- `NewEntryCard`: Datum-Input rendert mit heutigem Datum; Änderung des Datums aktualisiert draft.date; Reset setzt Datum auf Heute
- `EditEntryDrawer`: Datum-Feld zeigt `entry.date`; Änderung wird in `onSave` übergeben
- `ErfassungPage`: Bei All-Duplikat-Import wird `range` auf `'all'` gesetzt und passende Meldung angezeigt
