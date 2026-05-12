# Leistungserfassung — Implementierungs-Spec

**Eine** Designrichtung, kein Variantenwahl mehr. Hybrid = Konservativ-Struktur + Modern-Farbpalette + 3-zeilige Tabellen-Rows.

Diese Spec ist **so präzise wie möglich** geschrieben: alle Pixel, Hex-Codes, Spalten-Tracks, Padding und Schriftgrößen sind explizit. Wenn ein Wert in der Tabelle steht, ist das **der** Wert, nicht „ungefähr".

---

## 1. Tech-Stack (fest)

- **React 18 + TypeScript** (`"strict": true`)
- **Vite** (kein Next.js)
- **Tailwind CSS 4** mit `@theme` für die Tokens unten — keine inline-styles im Endprodukt
- **Zustand** für UI-State, **TanStack Query** für Server-State
- **date-fns** für alle Datums-Operationen, Locale `de`
- **Radix UI Primitives** für Dropdown, Popover, Dialog, Tooltip — danach selbst gestyled
- **Lucide-React** für Icons (`Clock`, `Plus`, `Play`, `Pause`, `Square`, `Search`, `Filter`, `ChevronDown`, `Pencil`, `Trash2`, `MoreHorizontal`, `Download`, `Upload`, `Check`, `X`, `ArrowLeft`, `ArrowRight`, `Home`, `List`, `Calendar`, `BarChart3`, `Settings`)

---

## 2. Design-Tokens

In `src/styles/tokens.css` als CSS-Variablen, in `tailwind.config` als `@theme`-Werte einlesen.

### 2.1 Farben

```css
:root {
  --bg:            #fafaf9;  /* stone-50  — App-Hintergrund */
  --card:          #ffffff;  /* Card / Tabelle-Background */
  --surface-2:     #fafaf9;  /* Day-Group-Header, Hover */
  --border:        #e7e5e4;  /* stone-200 — sichtbare Kanten */
  --border-soft:   #f1efee;  /* stone-100 — interne Trenner (Row-Bottom) */
  --hover:         #f5f5f4;  /* stone-100 — Row-Hover */

  --text:          #1c1917;  /* stone-900 */
  --body:          #44403c;  /* stone-700 */
  --muted:         #78716c;  /* stone-500 */
  --subtle:        #a8a29e;  /* stone-400 */

  --accent:        #16a34a;  /* green-600 — primary action */
  --accent-hover:  #15803d;  /* green-700 */
  --accent-soft:   #f0fdf4;  /* green-50 */
  --accent-text:   #166534;  /* green-800 — Text auf accent-soft */

  --danger:        #b91c1c;
  --info:          #1d4ed8;
  --purple:        #6d28d9;

  /* Task-Pills (fest) */
  --task-bug-bg:    #fef2f2;  --task-bug-fg:    #b91c1c;
  --task-feat-bg:   #f0fdf4;  --task-feat-fg:   #15803d;
  --task-rev-bg:    #eff6ff;  --task-rev-fg:    #1d4ed8;
  --task-meet-bg:   #faf5ff;  --task-meet-fg:   #7e22ce;
}
```

### 2.2 Typografie

- **Font-Family:** `Inter` (400 / 500 / 600 / 700). Numbers überall `font-variant-numeric: tabular-nums`.
- **Mono:** `ui-monospace, "JetBrains Mono", "SF Mono", monospace` — nur für Zeiten, IDs, Zeitkonto, JIRA, PR.
- **Größen** (rem-Equivalente in Klammern, base 16):
  - Page Title: `22px` / 600 / `letter-spacing: -0.3px`
  - Section/Caps-Label: `12px` / 500 / `uppercase` / `letter-spacing: 0.4px` / `color: var(--subtle)`
  - Body: `13px` / 400 / `color: var(--text)`
  - Body-Small: `12px` / 400 / `color: var(--muted)`
  - Caption: `11.5px` / 500 / `color: var(--subtle)`
  - KPI-Number: `24px` / 600 / `letter-spacing: -0.5px`
  - Row-Duration: `18px` / 600 / `letter-spacing: -0.3px`

### 2.3 Spacing & Radius

- Page-Padding: `28px 36px 40px`
- Card-Gap (vertikal): `22px`
- Card-Border-Radius: `12px`
- Card-Inner-Padding: `14px 18px` (Header), `16px 18px` (Body)
- Button-Radius: `7px`
- Pill-Radius: `4–5px`
- Field-Input-Padding: `9px 11px`, Border-Radius `7px`
- Shadow (nur Card): keine — nur `1px` Border. Drawer/Popover bekommt `0 10px 30px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.1)`.

---

## 3. Datenmodell

### 3.1 `TimeEntry`

```ts
export type TaskType = 'Bug-Fixing' | 'Feature' | 'Review' | 'Meeting';

export interface TimeEntry {
  id: string;                  // uuid
  date: string;                // 'YYYY-MM-DD'
  start: string;               // 'HH:mm'
  end: string | null;          // 'HH:mm' | null  (null = Timer läuft)
  client: string;              // 'WASCOSA'
  orderNo: string;             // 'SP 07-2026'
  account: string;             // '#WX-225 | Rad-Tausch'
  task: TaskType;
  description: string;
  externalId?: string;         // 'WX-99'
  jira?: string;               // 'WX-352'
  pr?: string;                 // '474' (ohne '#')
  createdAt: string;           // ISO
  updatedAt: string;           // ISO
}
```

**Berechnete Felder** (nicht gespeichert):

```ts
durationMinutes(e): number =
  e.end ? diff(parse(date+end), parse(date+start)) : diff(now(), parse(date+start));
```

### 3.2 Persistierung

- API-Routen: `GET /api/entries?from=&to=&client=&q=`, `POST /api/entries`, `PATCH /api/entries/:id`, `DELETE /api/entries/:id`.
- localStorage:
  - `timesheet.collapsedDays` — `string[]` (ISO-Dates).
  - `timesheet.activeTimer` — `{ entryDraft: Partial<TimeEntry>, startedAt: number } | null`.
  - `timesheet.lastClient`, `timesheet.lastOrderNo`, `timesheet.lastAccount` — für Vorschläge im Formular.

---

## 4. Seiten-Layout

Eine Page: `/erfassung`. Andere Routen (`/dashboard`, `/berichte`, …) stubben, aber Sidebar zeigt sie.

```
┌──────────────────────────────────────────────────────────────────┐
│ Header (56px)                                                    │
├────┬─────────────────────────────────────────────────────────────┤
│Side│  Page-Padding 28px 36px                                     │
│bar │                                                              │
│ 56 │  PageTitle (KW-Label · H1 · CSV-Buttons)                    │
│ px │                                                              │
│    │  KpiRow  4 Cards (gap 12px)                                 │
│    │                                                              │
│    │  NewEntryCard (Inline-Card, NICHT Drawer)                   │
│    │                                                              │
│    │  Toolbar (Quick-Filter · Suche · Auftraggeber-Filter)       │
│    │                                                              │
│    │  EntryTable (Tree-View, 3-zeilige Rows)                     │
└────┴─────────────────────────────────────────────────────────────┘
```

### 4.1 Header (56px, sticky)

- Background `var(--card)`, Border-Bottom `1px solid var(--border)`.
- Padding `0 24px`, `gap: 20px`, `display: flex; align-items: center`.
- Logo: 28×28, Border-Radius 7px, Background `var(--accent)`, weißes `Clock`-Icon (16px).
- Brand-Wordmark: `15px / 600 / letter-spacing: -0.1px`: „Leistungserfassung".
- Nav: 4 Items (Übersicht, **Erfassung** (active), Berichte, Stammdaten) — Padding `8px 12px`, `13.5px`, aktiv = `text` + `600` + `hover` background, inaktiv = `muted` + `500`.
- Rechts: Search-Pill (Border `var(--border)`, Padding `6px 10px`, Radius 7, Text „Suchen" + `⌘K`-Hint in 11px-Kasten) + Avatar 28×28 Circle, `#dbeafe` bg, `#1e3a8a` fg, Initialen „MK".

### 4.2 Sidebar (56px, Icon-Only)

5 Icons vertikal (`Home`, `List`(active), `Calendar`, `BarChart3`, `Settings`).

- Container: width 56, Border-Right `var(--border)`, Padding `14px 0`, `align-items: center`, `gap: 4px`.
- Item: 36×36, Border-Radius 8, `grid place-items: center`, Icon 17px. Active: Background `var(--accent-soft)`, Color `var(--accent)`. Inaktiv: Color `var(--muted)`. Tooltip per Hover (Radix Tooltip, Delay 300ms).

### 4.3 PageTitle

Flex `justify-content: space-between`, `align-items: flex-end`, `margin-bottom: 18px`.

- Links:
  - Caps-Label: „Dienstag · KW 20" (dynamisch).
  - H1 `22px / 600`: „Zeiterfassung — DD.MM.YYYY" (heutiges Datum).
- Rechts: Zwei `btnSecondary`-Buttons: „CSV exportieren" (`Download`-Icon), „CSV importieren" (`Upload`-Icon). Gap 8.

### 4.4 KpiRow

`grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px`.

| # | Label | Wert (Beispiel) | Sublabel | Progress-Anteil |
|---|---|---|---|---|
| 1 | Heute | `2:45h` | „von 8h Soll" | `today / (8·60)` |
| 2 | Diese Woche | `17:45h` | „von 40h Soll" | `week / (40·60)` |
| 3 | Überstunden | `+2:15h` | „Saldo Mai" | `0.5` (Demo) |
| 4 | Offene Tickets | `3` | „2× WX, 1× DB" | `0.35` (Demo) |

Card: Background `var(--card)`, Border `1px solid var(--border)`, Border-Radius 10, Padding `14px 16px`.

- Label-Row: `12px / 500 / muted`.
- Value-Row: `24px / 600 / letter-spacing: -0.5px / tabular-nums`. Margin `4px 0 2px`.
- Sublabel: `11.5px / subtle`.
- Progress-Bar: `height: 3px`, Background `var(--border-soft)`, Border-Radius 2, `margin-top: 10px`. Fill: `var(--accent)`, Width `min(100, pct·100)%`.

### 4.5 NewEntryCard (Inline)

Card-Container `12px` Radius, `1px` Border, kein Shadow. `margin-bottom: 22px`.

**Card-Header** (`padding: 14px 18px`, Border-Bottom `var(--border-soft)`):

- Links: `Plus`-Icon (15px, `var(--accent)`), Bold-Title „Neuer Eintrag" (`14px / 600`), grau-Subtitle „· Datum DD.MM.YYYY" (`12px / muted`).
- Rechts: Caption „Stoppuhr" + Pill-Button „Start" (`Play`-Icon, Background `var(--accent-soft)`, Color `var(--accent-text)`, Padding `5px 11px`, Radius 6, `12px / 600`).

**Form-Row 1** (`padding: 16px 18px`, Grid-Cols `1.4fr 1fr 1fr 0.7fr 0.7fr 0.7fr`, Gap 12):

`Auftraggeber*` · `Auftragsnr.*` · `Zeitkonto*` · `Start` · `Ende` · `Dauer`.

Start/Ende/Dauer haben Mono-Font + `tabular-nums`. Dauer ist **readonly**, berechnet live.

**Form-Row 2** (`padding: 0 18px 18px`, Grid-Cols `2.2fr 0.6fr 0.6fr 1fr`, Gap 12):

`Beschreibung` (Textarea, `height: 38px`, kein Resize) · `JIRA-Ticket` · `Pull-Request` · Actions („Abbrechen" ghost + „Speichern" primary mit `Check`-Icon, flex 1).

**Field-Komponente** (`src/components/Field.tsx`):

- Label: `block / 11.5px / 500 / muted / margin-bottom: 5px`. Pflicht-Stern in `var(--accent)`.
- Input: `padding: 9px 11px`, Border `var(--border)`, Radius 7, `13px`, `box-sizing: border-box`, `outline: none`. Mono-Variante: `ui-monospace` + `tabular-nums`. Suggestion-Mode: rechts im Feld kleines Pill „letzte" (`10px / 600`, accent-soft).

**Vorbelegung:**

- Datum = heute.
- Start = jetzt (gerundet auf 5 min), Ende leer.
- Auftraggeber/Auftragsnr./Zeitkonto = `localStorage["timesheet.last*"]`, mit „letzte"-Pill.

**Validierung** (vor Speichern):

- Alle `*`-Felder gefüllt.
- `end > start` oder `end` leer.
- Mindestens 5 Zeichen Beschreibung.

**Tastatur:**

- `Tab` zyklisch durch Felder.
- `Cmd/Ctrl + Enter` = Speichern.
- `Esc` = Felder leeren.

### 4.6 Toolbar

Display flex, `align-items: center`, `gap: 10px`, `margin-bottom: 12px`.

- **Segmented-Control** Quick-Filter: 4 Buttons („Heute", „Woche", „Monat", „Eigener Zeitraum") in `1px` Border-Container mit Radius 8 + Padding 3. Aktiver Button: Background `var(--text)`, Color `#fff`, Radius 6, Padding `6px 12px`, `12.5px / 500`. Inaktiv: `muted`, transparent.
- **Search-Input** (flex 1): `Search`-Icon 13px + Input, Container Card-Background, Border `var(--border)`, Radius 8, Padding `6px 10px`. Placeholder „Filter nach Auftrag, JIRA, Beschreibung…".
- **Auftraggeber-Dropdown** (`btnSecondary`): `Filter`-Icon + Label + `ChevronDown`. Öffnet Radix-Dropdown mit Checkboxes (alle distinct `client`).

---

## 5. EntryTable (3-zeilige Rows) — DAS Kern-Element

**Container:** Background `var(--card)`, Border `1px solid var(--border)`, Border-Radius 12, `overflow: hidden`. Keine globale Header-Row mehr.

### 5.1 Day-Group-Header (klickbar, Tree-Toggle)

- Höhe ca. 36px, Background `var(--surface-2)`, Border-Bottom `var(--border-soft)`, Padding `10px 16px`.
- Layout: flex `align-items: center`, `gap: 8px`.
- Chevron `ChevronDown` 13px, `var(--muted)`, `transform: rotate(0)` offen → `rotate(-90deg)` zu, `transition: transform 150ms`.
- Day-Label `12px / 600 / text`: „Dienstag, 12.05.2026" (deutsche Locale, voller Wochentag).
- Entry-Count `12px / subtle`: „· 3 Einträge".
- Day-Total (rechts, `margin-left: auto`): Pill `2px 9px`, Radius 5, Background `var(--accent-soft)`, Color `var(--accent-text)`, `tabular-nums / 600`. Format `H:MMh`.
- Click → toggle Collapse-State + Persist in `timesheet.collapsedDays`.
- ARIA: `<button aria-expanded={!collapsed} aria-controls={`day-${date}`}>`.

### 5.2 Entry-Row (3-zeilig, das ist neu)

Eine Row hat **4 Grid-Spalten** und intern **3 Textzeilen** in der mittleren Hauptspalte.

```
grid-template-columns: 4px 110px 1fr 100px 110px;
column-gap: 16px;
padding: 14px 16px 14px 12px;
border-bottom: 1px solid var(--border-soft);
align-items: stretch;
background: transparent → var(--hover) on row hover;
```

**Col 1 — Tree-Anchor (4px):** Vertikal mittig, 4×4-Punkt in `var(--subtle)`, Radius 2.

**Col 2 — Zeit-Stack (110px, flex column, gap 2):**

- **Line 1**: `start – end` in Mono, 13px, 500, `var(--text)`, `tabular-nums`.
- **Line 2**: Datum kurz „DD.MM" + Wochentag-Kürzel „Di" in 11.5px / subtle.
- **Line 3** (am unteren Rand, `margin-top: auto`): **Task-Pill** (siehe 5.3).

**Col 3 — Haupt-Stack (flex 1fr, flex column, gap 3):**

- **Line 1 — Auftrag-Header**: Client-Dot (6×6, Square Radius 2, Farbe pro Client) + `client` (12.5px / 600 / text) + „·" + `orderNo` (Mono 12 / muted) + „·" + `account` (Mono 12 / muted).
  - Bei mehr als ein paar Clients: Dot-Farben deterministisch aus `client` hashen → eine Palette von 8 Farben.
- **Line 2 — Beschreibung**: `13.5px / 500 / text`, `line-height: 1.35`, **kein Truncate** — wenn lang, umbrechen.
- **Line 3 — Refs**: Inline-Row mit Icon-Pairs:
  - JIRA: `Jira`-Icon 11px + Mono-Code in `var(--info)` (`#1d4ed8`).
  - PR: `GitBranch`-Icon 11px + `#NNN` in Mono in `var(--purple)`.
  - Ext-ID: Label „Ext:" + Mono-Code in `var(--muted)`.
  - Wenn keine → Italic „keine Referenzen" in `var(--subtle)`.

**Col 4 — Dauer (100px, rechtsbündig, flex column center):**

- **Big-Number**: `18px / 600 / tabular-nums / letter-spacing: -0.3px / text`. Format `H:MMh`.
- **Caption**: „Dauer" in `11px / subtle`.

**Col 5 — Actions (110px, rechtsbündig, flex row, gap 4):**

- Vier Icon-Buttons je 26×26, Border-Radius 5: `Pencil` (Bearbeiten), `Plus` (Duplizieren), `Trash2` (Löschen), `MoreHorizontal` (Kebab-Menü).
- Standard `opacity: 0.35`, on row hover `opacity: 1`, `transition: opacity 120ms`.
- Color `var(--muted)`, Hover `var(--text)`.

### 5.3 Task-Pill

`11px / 600 / padding: 2px 7px / radius: 4`, Farben aus den `--task-*`-Variablen je nach `task`-Wert.

### 5.4 Row-Interaktion

- **Hover**: Background `var(--hover)`, Actions sichtbar.
- **Click auf Beschreibung-Bereich**: öffnet Bearbeiten-Drawer.
- **Click auf Pencil**: dito.
- **Click auf Trash**: Confirm-Toast „Eintrag gelöscht — rückgängig machen" mit 5 s-Undo.
- **Right-Click**: Kontext-Menü (Bearbeiten, Duplizieren, Löschen, Als Vorlage kopieren).

### 5.5 Empty- und Loading-States

- **Loading**: 5 Skeleton-Rows (graue Blöcke an Stelle der Texte, `animate-pulse`).
- **Empty (keine Einträge)**: Centered Box mit Icon + „Noch keine Zeiten erfasst" + Primary-Button „Ersten Eintrag anlegen".
- **Empty nach Filter**: „Keine Treffer für „{query}". Filter zurücksetzen."

---

## 6. Komponenten-Inventory

```
src/
├── data/
│   ├── entries.ts          // CRUD + Query-Hooks (useEntries, useUpsertEntry, useDeleteEntry)
│   ├── format.ts           // fmtH, fmtHshort, fmtDateDE, fmtDayLabel, durationMinutes
│   └── filter.ts           // applyFilter(entries, {range, search, client})
├── components/
│   ├── Field.tsx           // label + input/textarea, props: required, mono, suggestion, error
│   ├── Button.tsx          // variant: primary | secondary | ghost | icon
│   ├── Pill.tsx            // variant: task | jira | pr | meta
│   ├── KpiCard.tsx
│   └── SegmentedControl.tsx
├── features/
│   ├── header/
│   │   ├── AppHeader.tsx
│   │   └── AppSidebar.tsx
│   ├── new-entry/
│   │   ├── NewEntryCard.tsx
│   │   ├── useDraft.ts            // Draft + Validation
│   │   └── suggestions.ts         // last-used helpers
│   ├── filters/
│   │   ├── Toolbar.tsx
│   │   └── ClientFilterDropdown.tsx
│   └── entry-list/
│       ├── EntryTable.tsx         // Day-Groups + Collapse-State
│       ├── DayGroupHeader.tsx
│       ├── EntryRow.tsx           // 3-zeilige Row aus §5.2
│       └── EditEntryDrawer.tsx
├── stores/
│   ├── ui.ts                      // collapsedDays, drawerOpen
│   └── timer.ts                   // activeTimer + persist
├── pages/
│   └── ErfassungPage.tsx
└── styles/
    └── tokens.css
```

---

## 7. Akzeptanzkriterien (testbar)

1. **Datenmodell**: Schema-Test mit Zod — `TimeEntry`-Validator akzeptiert alle Demo-Einträge aus `shared.jsx`.
2. **Tabelle**: Eine `EntryRow` rendert genau 3 Text-Lines in Col 3 (DOM-Test: `getByTestId('entry-row').querySelectorAll('[data-line]').length === 3`).
3. **Tree-View**: Klick auf Day-Header toggled `aria-expanded`, Rows werden ausgeblendet (`getAllByRole('row')`-Count sinkt).
4. **Persistenz**: Nach Reload sind kollabierte Tage immer noch kollabiert.
5. **Quick-Filter**: Wechsel von „Heute" → „Woche" lädt eine andere Result-Menge (Mock-API zählt Calls).
6. **Live-Timer**: Bei aktivem Timer wird Sekunde im Header oder als Floating-Indicator angezeigt; übersteht Tab-Refresh ohne >1 s Drift.
7. **Validation**: Speichern ohne `client` zeigt Field-Error (Border `var(--danger)`, Text-Error darunter).
8. **CSV-Export**: Enthält genau die aktuell gefilterten Zeilen, Spalten-Reihenfolge wie Datenmodell.
9. **A11y**: Lighthouse Accessibility ≥ 95. Alle Buttons haben `aria-label` oder sichtbares Label. Fokus-Ring `2px solid var(--accent), offset 2px`.
10. **Performance**: First-Render < 200 ms für 500 Einträge. Virtualisierung (TanStack Virtual) ab > 200 sichtbaren Rows.

---

## 8. Konkrete Pixel-Specs (Zusammenfassung)

| Element | Wert |
|---|---|
| Header-Höhe | 56 |
| Sidebar-Breite | 56 |
| Page-Padding | 28 / 36 / 40 (top / x / bottom) |
| Card-Radius | 12 |
| Card-Inner-Padding | 14×18 (header) / 16×18 (body) |
| Card-Gap vertikal | 22 |
| KPI-Cards | 4 × 1fr, gap 12 |
| Button-Radius | 7 |
| Field-Padding | 9×11 |
| Field-Radius | 7 |
| Pill-Radius | 4 (task) / 5 (day-total / refs) |
| Row-Padding | 14 oben, 14 unten, 16 rechts, 12 links |
| Row-Grid | `4px / 110px / 1fr / 100px / 110px`, gap 16 |
| Row-Border-Bottom | 1px var(--border-soft) |
| Row-Inner-Gap (Col 3) | 3 |
| Day-Group-Header-Padding | 10×16 |
| Icon-Button | 26×26, radius 5 |
| Task-Pill | padding 2×7, radius 4, 11px / 600 |
| Duration-Number | 18px / 600 / -0.3 letter-spacing |
| Primary-Color | `#16a34a` |
| Background | `#fafaf9` |
| Card | `#ffffff` |
| Border | `#e7e5e4` |
| Border-Soft | `#f1efee` |
| Text | `#1c1917` |
| Muted | `#78716c` |
| Subtle | `#a8a29e` |

---

## 9. Was Claude Code **nicht** machen soll

- Keine inline-Styles im Produktiv-Code — alles über Tailwind + Tokens.
- Kein Mode-Toggle (Dark, Light, Compact) — eine Darstellung.
- Keine zusätzlichen Designvarianten erfinden.
- Keine Icons selbst zeichnen — nur Lucide.
- Keine Standalone-Modal für Eintrag-Anlage — die `NewEntryCard` ist **inline**.
- Kein Gradient, kein Glassmorphism, keine Card-Shadows außer Drawer/Popover.
