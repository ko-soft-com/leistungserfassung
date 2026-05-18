# Editierbares Datum + CSV-Duplikat-UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Datum beim Erstellen und Bearbeiten von Einträgen editierbar machen; bei All-Duplikat-Import automatisch alle Einträge anzeigen mit klarer Meldung.

**Architecture:** Drei unabhängige Änderungen: (1) NewEntryCard Header-Datum wird zu `<input type="date">` gebunden an `draft.date` in `useDraft`; (2) EditEntryDrawer bekommt ein Datum-`<Field>` als erstes Feld; (3) `Range`-Typ wird um `'all'` erweitert, der CSV-Handler switcht automatisch auf `'all'` wenn alle Einträge Duplikate waren.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, @testing-library/user-event, CSS Modules, date-fns

---

## File Map

| Datei | Änderung |
|---|---|
| `src/features/new-entry/NewEntryCard.tsx` | Statischen Datum-Span durch `<input type="date">` ersetzen |
| `src/features/new-entry/NewEntryCard.module.css` | CSS-Klasse `.dateInput` hinzufügen |
| `src/features/new-entry/__tests__/NewEntryCard.test.tsx` | 2 neue Tests |
| `src/features/entry-list/EditEntryDrawer.tsx` | Datum-`<Field>` als erstes Body-Feld |
| `src/features/entry-list/__tests__/EditEntryDrawer.test.tsx` | 2 neue Tests |
| `src/data/filter.ts` | `'all'` zu `Range` hinzufügen; `applyFilter` behandelt es |
| `src/features/filters/Toolbar.tsx` | Option `'Alle'` zu `RANGE_OPTIONS` hinzufügen |
| `src/pages/ErfassungPage.tsx` | CSV-Handler: `setRange('all')` + neue Meldung bei All-Duplikaten |
| `src/pages/__tests__/ErfassungPage.test.tsx` | 1 neuer Test für All-Duplikat-Verhalten |

---

## Task 1: Datum-Input in NewEntryCard

**Files:**
- Modify: `src/features/new-entry/NewEntryCard.tsx:76`
- Modify: `src/features/new-entry/NewEntryCard.module.css`
- Test: `src/features/new-entry/__tests__/NewEntryCard.test.tsx`

- [ ] **Schritt 1: Failing Tests schreiben**

Am Ende der `describe('NewEntryCard', ...)` Block in `src/features/new-entry/__tests__/NewEntryCard.test.tsx` hinzufügen:

```tsx
it('renders a date input defaulting to today', () => {
  render(<NewEntryCard />)
  const today = new Date().toISOString().slice(0, 10)
  const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
  expect(dateInput).toBeInTheDocument()
  expect(dateInput.value).toBe(today)
})

it('updates draft.date when date input changes', async () => {
  const user = userEvent.setup()
  render(<NewEntryCard />)
  const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
  await user.clear(dateInput)
  await user.type(dateInput, '2026-05-10')
  expect(dateInput.value).toBe('2026-05-10')
})
```

- [ ] **Schritt 2: Tests laufen lassen → FAIL bestätigen**

```bash
npx vitest run src/features/new-entry/__tests__/NewEntryCard.test.tsx
```

Erwartet: FAIL mit „Unable to find a label with the text of: Datum"

- [ ] **Schritt 3: Statischen Span durch `<input type="date">` ersetzen**

In `src/features/new-entry/NewEntryCard.tsx`, Zeile 76 ersetzen:

```tsx
// Vorher:
<span className={styles.subtitle}>· {format(new Date(), 'dd.MM.yyyy')}</span>

// Nachher:
<input
  type="date"
  aria-label="Datum"
  className={styles.dateInput}
  value={draft.date}
  onChange={e => setField('date', e.target.value)}
/>
```

Vollständige Änderungen in `src/features/new-entry/NewEntryCard.tsx`:

```tsx
// Zeile 3: Entfernen
import { format } from 'date-fns'

// Zeile 76: Ersetzen
<span className={styles.subtitle}>· {format(new Date(), 'dd.MM.yyyy')}</span>
// durch:
<input
  type="date"
  aria-label="Datum"
  className={styles.dateInput}
  value={draft.date}
  onChange={e => setField('date', e.target.value)}
/>
```

- [ ] **Schritt 4: CSS-Klasse `.dateInput` hinzufügen**

In `src/features/new-entry/NewEntryCard.module.css`, nach `.subtitle` (Zeile 20) einfügen:

```css
.dateInput {
  font-size: 12px;
  color: var(--muted);
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: var(--font-sans);
  padding: 0;
}

.dateInput:focus {
  color: var(--text);
}
```

- [ ] **Schritt 5: Tests laufen lassen → PASS bestätigen**

```bash
npx vitest run src/features/new-entry/__tests__/NewEntryCard.test.tsx
```

Erwartet: alle Tests PASS

- [ ] **Schritt 6: Gesamte Test-Suite prüfen**

```bash
npx vitest run
```

Erwartet: keine neuen Fehler

- [ ] **Schritt 7: Commit**

```bash
git add src/features/new-entry/NewEntryCard.tsx src/features/new-entry/NewEntryCard.module.css src/features/new-entry/__tests__/NewEntryCard.test.tsx
git commit -m "feat(new-entry): make date editable in NewEntryCard header"
```

---

## Task 2: Datum-Feld in EditEntryDrawer

**Files:**
- Modify: `src/features/entry-list/EditEntryDrawer.tsx:34`
- Test: `src/features/entry-list/__tests__/EditEntryDrawer.test.tsx`

- [ ] **Schritt 1: Failing Tests schreiben**

In `src/features/entry-list/__tests__/EditEntryDrawer.test.tsx`, nach dem zweiten `it(...)` Block einfügen:

```tsx
it('renders the entry date', () => {
  render(<EditEntryDrawer entry={entry} onSave={() => {}} onClose={() => {}} />)
  const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
  expect(dateInput).toBeInTheDocument()
  expect(dateInput.value).toBe('2026-05-12')
})

it('passes updated date to onSave', async () => {
  const onSave = vi.fn()
  render(<EditEntryDrawer entry={entry} onSave={onSave} onClose={() => {}} />)
  const dateInput = screen.getByLabelText('Datum') as HTMLInputElement
  fireEvent.change(dateInput, { target: { value: '2026-05-13' } })
  await userEvent.click(screen.getByText('Speichern'))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-05-13' }))
})
```

Den `fireEvent`-Import am Anfang der Datei hinzufügen:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
```

- [ ] **Schritt 2: Tests laufen lassen → FAIL bestätigen**

```bash
npx vitest run src/features/entry-list/__tests__/EditEntryDrawer.test.tsx
```

Erwartet: FAIL mit „Unable to find a label with the text of: Datum"

- [ ] **Schritt 3: Datum-Field in EditEntryDrawer einfügen**

In `src/features/entry-list/EditEntryDrawer.tsx`, Zeile 34 — das `<div className={styles.body}>` mit folgendem Inhalt (Datum-Field als erstes Element vor `edit-auftraggeber`):

```tsx
<div className={styles.body}>
  <Field id="edit-date" label="Datum" type="date" value={draft.date} onChange={v => setField('date', v)} />
  <Field id="edit-auftraggeber" label="Auftraggeber" required value={draft.client} onChange={v => setField('client', v)} />
  {/* ... rest unverändert */}
```

Vollständige ersetzte Stelle (Zeilen 34–47 in EditEntryDrawer.tsx):

```tsx
          <div className={styles.body}>
            <Field id="edit-date" label="Datum" type="date" value={draft.date} onChange={v => setField('date', v)} />
            <Field id="edit-auftraggeber" label="Auftraggeber" required value={draft.client} onChange={v => setField('client', v)} />
            <Field id="edit-orderNo" label="Auftragsnr." required value={draft.orderNo} onChange={v => setField('orderNo', v)} />
            <Field id="edit-zeitkonto" label="Zeitkonto" required value={draft.account} onChange={v => setField('account', v)} />
            <div className={styles.timeRow}>
              <Field id="edit-start" label="Start" mono value={draft.start ?? ''} onChange={v => setField('start', v || null)} />
              <Field id="edit-ende" label="Ende" mono value={draft.end ?? ''} onChange={v => setField('end', v || null)} />
            </div>
            <Field id="edit-beschreibung" label="Beschreibung" multiline value={draft.description} onChange={v => setField('description', v)} />
            <div className={styles.refRow}>
              <Field id="edit-jira" label="JIRA-Ticket" mono value={draft.jira ?? ''} onChange={v => setField('jira', v || undefined)} />
              <Field id="edit-pr" label="Pull-Request" mono value={draft.pr ?? ''} onChange={v => setField('pr', v || undefined)} />
            </div>
          </div>
```

- [ ] **Schritt 4: Tests laufen lassen → PASS bestätigen**

```bash
npx vitest run src/features/entry-list/__tests__/EditEntryDrawer.test.tsx
```

Erwartet: alle 4 Tests PASS

- [ ] **Schritt 5: Gesamte Test-Suite prüfen**

```bash
npx vitest run
```

Erwartet: keine neuen Fehler

- [ ] **Schritt 6: Commit**

```bash
git add src/features/entry-list/EditEntryDrawer.tsx src/features/entry-list/__tests__/EditEntryDrawer.test.tsx
git commit -m "feat(edit-entry): add editable date field to EditEntryDrawer"
```

---

## Task 3: Range 'all' + CSV-Duplikat-UX

**Files:**
- Modify: `src/data/filter.ts:3`
- Modify: `src/features/filters/Toolbar.tsx:6-11`
- Modify: `src/pages/ErfassungPage.tsx:87-95`
- Test: `src/pages/__tests__/ErfassungPage.test.tsx`

- [ ] **Schritt 1: Failing Test schreiben**

In `src/pages/__tests__/ErfassungPage.test.tsx`, nach dem letzten `describe`-Block (nach Zeile 130) einfügen:

```tsx
describe('CSV import duplicate handling', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('switches to Alle and shows duplicate message when all CSV entries already exist', async () => {
    saveTimeEntry({
      date: '2026-01-01', start: '09:00', end: '10:00',
      client: 'AltKunde', orderNo: 'ALT-1', account: 'Dev',
      task: 'Feature', description: 'Schon vorhanden',
    })

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ErfassungPage />
      </QueryClientProvider>
    )

    const csvContent = [
      'date,start,end,client,orderNo,account,task,hours,minutes,description,externalId,jira,pr',
      '2026-01-01,09:00,10:00,AltKunde,ALT-1,Dev,Feature,1,0,Schon vorhanden,,,',
    ].join('\n')

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('CSV-Datei importieren')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/bereits vorhanden/)
    })

    // 'Alle' button is now rendered and active in the SegmentedControl
    expect(screen.getByRole('button', { name: 'Alle' })).toBeInTheDocument()
  })
})
```

- [ ] **Schritt 2: Test laufen lassen → FAIL bestätigen**

```bash
npx vitest run src/pages/__tests__/ErfassungPage.test.tsx
```

Erwartet: FAIL weil „bereits vorhanden" nicht im DOM erscheint

- [ ] **Schritt 3: `'all'` zu Range-Typ und applyFilter hinzufügen**

In `src/data/filter.ts`, Zeile 3:

```typescript
// Vorher:
export type Range = 'today' | 'week' | 'month' | 'custom'

// Nachher:
export type Range = 'today' | 'week' | 'month' | 'all' | 'custom'
```

In `applyFilter`, nach dem `opts.range === 'today'`-Block (nach Zeile 36) — kein neuer Case nötig, da ohne explizites Matching bereits alle Einträge durchgelassen werden. Aber zur Klarheit im Code den `else if`-Block für `'all'` explizit ergänzen. Die vollständige `applyFilter`-Funktion (Zeilen 18–55) wird zu:

```typescript
export function applyFilter(entries: TimeEntry[], opts: FilterOptions): TimeEntry[] {
  let result = entries

  if (opts.search) {
    const q = opts.search.toLowerCase()
    result = result.filter(e =>
      e.description.toLowerCase().includes(q) ||
      e.client.toLowerCase().includes(q) ||
      e.orderNo.toLowerCase().includes(q) ||
      e.account.toLowerCase().includes(q) ||
      (e.jira ?? '').toLowerCase().includes(q)
    )
  }

  if (opts.client) {
    result = result.filter(e => e.client === opts.client)
  }

  if (opts.range === 'today') {
    const today = localISO(new Date())
    result = result.filter(e => e.date === today)
  } else if (opts.range === 'week') {
    const now = new Date()
    const weekStart = new Date(now)
    const day = now.getDay() === 0 ? 7 : now.getDay()
    weekStart.setDate(now.getDate() - day + 1)
    const from = localISO(weekStart)
    const to = localISO(now)
    result = result.filter(e => e.date >= from && e.date <= to)
  } else if (opts.range === 'month') {
    const prefix = localISO(new Date()).slice(0, 7)
    result = result.filter(e => e.date.startsWith(prefix))
  } else if (opts.range === 'custom' && opts.from && opts.to) {
    result = result.filter(e => e.date >= opts.from! && e.date <= opts.to!)
  }
  // 'all': kein Datumsfilter

  return result
}
```

- [ ] **Schritt 4: `'Alle'`-Option in Toolbar hinzufügen**

In `src/features/filters/Toolbar.tsx`, `RANGE_OPTIONS` (Zeilen 6–11):

```typescript
const RANGE_OPTIONS = [
  { label: 'Heute', value: 'today' },
  { label: 'Woche', value: 'week' },
  { label: 'Monat', value: 'month' },
  { label: 'Alle', value: 'all' },
  { label: 'Eigener Zeitraum', value: 'custom' },
]
```

- [ ] **Schritt 5: CSV-Handler in ErfassungPage anpassen**

In `src/pages/ErfassungPage.tsx`, den `parts`-Block im `handleFileChange` (Zeilen 87–95) ersetzen:

```typescript
      const parts: string[] = []
      if (toImport.length > 0) parts.push(`${toImport.length} Einträge importiert`)
      if (formatSkipped > 0) parts.push(`${formatSkipped} ungültige Zeilen`)

      if (toImport.length === 0 && dupSkipped > 0) {
        setRange('all')
        setCsvMessage(`${dupSkipped} ${dupSkipped === 1 ? 'Eintrag' : 'Einträge'} bereits vorhanden — alle Einträge werden jetzt angezeigt.`)
      } else {
        if (dupSkipped > 0) parts.push(`${dupSkipped} Duplikate übersprungen`)
        if (parts.length === 0) {
          setCsvMessage('Die Datei enthält keine neuen Einträge.')
        } else {
          setCsvMessage(parts.join(', ') + '.')
        }
      }
```

- [ ] **Schritt 6: Tests laufen lassen → PASS bestätigen**

```bash
npx vitest run src/pages/__tests__/ErfassungPage.test.tsx
```

Erwartet: alle Tests PASS

- [ ] **Schritt 7: Gesamte Test-Suite prüfen**

```bash
npx vitest run
```

Erwartet: alle Tests PASS, keine neuen Fehler

- [ ] **Schritt 8: Commit**

```bash
git add src/data/filter.ts src/features/filters/Toolbar.tsx src/pages/ErfassungPage.tsx src/pages/__tests__/ErfassungPage.test.tsx
git commit -m "feat(csv): switch to 'Alle' view and show clear message on all-duplicate import"
```
