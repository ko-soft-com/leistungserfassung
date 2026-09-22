# Code Review — 2026-06-10

**Branch:** development  
**Commits reviewed:** `360f8fd8`…`19033dd5` (last 5 commits)  
**Files changed:** EntryTable.tsx, EntryTable.test.tsx, ErfassungPage.tsx, firestoreJiraTickets.ts  
**Effort:** high

---

## Findings

### 1. PLAUSIBLE — Empty-state suppressed after load for users with zero entries

**File:** `src/features/entry-list/EntryTable.tsx` line 38  
**Severity:** Medium (UX regression for new users)

The guard was tightened from `entries.length === 0` to `entries.length === 0 && visibleDates.length === 0`. Once loading completes, `visibleDates = last7Days` (7 items) is always non-empty. The condition is therefore permanently false after load. A new user with zero entries will see 7 empty day-group rows with blank presence fields instead of "Noch keine Zeiten erfasst".

During loading the message briefly appears (visibleDates=[] while isLoading=true), then vanishes. The `isLoading` gate fixes the DayPresenceRow initialisation bug correctly, but leaves this empty-state gap as a side-effect.

**Fix:** Use `entries.length === 0 && groups.length === 0` instead, computed after `groupByDate`, so dates-with-no-entries still suppress the message but only if no groups would render.

---

### 2. CONFIRMED — `localISO` duplicated across two files

**File:** `src/pages/ErfassungPage.tsx` ~line 36 and `src/data/filter.ts` line 13  
**Severity:** Low (cleanup / DRY violation)

Both files define an identical private `localISO(d: Date): string` helper using the same `pad` inner function. Neither imports from the other. The duplication risks the two implementations diverging if timezone handling changes.

**Fix:** Export `localISO` from `src/data/format.ts` (or `filter.ts`) and import it in `ErfassungPage.tsx`.

---

### 3. PLAUSIBLE — `data as JiraTicket` cast is unnecessary and confuses the type system

**File:** `src/services/firestoreJiraTickets.ts` line 46  
**Severity:** Low (code smell)

The function parameter is typed as `Omit<JiraTicket, 'id' | 'createdAt' | 'updatedAt'>`, so TypeScript already guarantees those three fields are absent. The cast `data as JiraTicket` exists only to make the `{ id: _id, createdAt: _c, updatedAt: _u, ...safeData }` destructuring compile — but at runtime `safeData` equals `data` unchanged since the stripped keys aren't present. The cast defeats the type guarantees silently.

**Fix:** Remove the destructuring line. Spread `data` directly: `const payload = { ...data, issueType: data.issueType ?? 'Task', ... }`.

---

### 4. PLAUSIBLE — `last7Days` recomputed on every render

**File:** `src/pages/ErfassungPage.tsx` lines 220–224  
**Severity:** Low (efficiency)

`last7Days` is computed inline inside the component body (no `useMemo`) creating 7 `new Date` objects and 7 `localISO` calls on every render. ErfassungPage re-renders on every keystroke in the search field, entry edit, etc.

**Fix:** Wrap in `useMemo(() => [...], [])` — the value only changes at midnight.

---

## What looks good

- **`isLoading ? [] : last7Days` fix is sound.** `Promise.all([getTimeEntries(), getAllDayRecords()])` ensures both datasets arrive together; React 18 batches the three `setState` calls into one render. When `isLoading` flips to `false`, `dayRecords` is already populated and `DayPresenceRow` mounts with the correct `initialRecord`. No race condition.
- **`groupByDate` sort is preserved.** The function returns `Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))` — date-descending order is maintained even for entries older than 7 days.
- **New test covers the `visibleDates` path.** The added test verifies that an empty entries array with a visibleDate still renders a DayPresenceRow.
