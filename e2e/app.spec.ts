import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

async function fillNewEntry(page: Parameters<typeof test>[1], overrides: {
  client?: string
  orderNo?: string
  account?: string
  start?: string
  end?: string
  description?: string
} = {}) {
  const {
    client = 'Kunde A',
    orderNo = 'AU-001',
    account = 'ZK-01',
    start = '09:00',
    end = '10:30',
    description = 'Testbeschreibung',
  } = overrides

  await page.getByRole('textbox', { name: 'Auftraggeber' }).fill(client)
  await page.getByLabel(/Auftragsnr/i).fill(orderNo)
  await page.getByLabel('Zeitkonto').fill(account)
  await page.getByLabel(/^Start$/i).fill(start)
  await page.getByLabel(/^Ende$/i).fill(end)
  await page.getByRole('textbox', { name: 'Beschreibung' }).fill(description)
}

test('shows empty state when no entries', async ({ page }) => {
  await expect(page.getByText('Noch keine Zeiten erfasst')).toBeVisible()
})

test('adds a new entry and displays it in the table', async ({ page }) => {
  await fillNewEntry(page)
  await page.getByRole('button', { name: 'Speichern' }).click()

  // The entry row is a role="button" with aria-label "Eintrag bearbeiten: {client} – {description}"
  await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Kunde A/ })).toBeVisible()
  await expect(page.getByText('AU-001')).toBeVisible()
  // Form should be reset after save
  await expect(page.getByRole('textbox', { name: 'Auftraggeber' })).toHaveValue('')
})

test('edits an existing entry via drawer', async ({ page }) => {
  await fillNewEntry(page, { client: 'Kunde A' })
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Kunde A/ })).toBeVisible()

  // Click the entry row to open EditEntryDrawer
  await page.getByRole('button', { name: /Eintrag bearbeiten: Kunde A/ }).click()
  await expect(page.getByText('Eintrag bearbeiten')).toBeVisible()

  const dialog = page.locator('[role="dialog"]')
  await dialog.getByLabel('Auftraggeber').fill('Kunde B')
  await dialog.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Kunde B/ })).toBeVisible()
})

test('deletes an entry', async ({ page }) => {
  await fillNewEntry(page, { client: 'Zu löschen' })
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Zu löschen/ })).toBeVisible()

  await page.getByRole('button', { name: 'Löschen', exact: true }).click()

  await expect(page.getByText('Noch keine Zeiten erfasst')).toBeVisible()
})

test.describe('Formular-Validierung', () => {
  test('zeigt Pflichtfeld-Fehler bei leerem Formular', async ({ page }) => {
    await page.getByRole('button', { name: 'Speichern' }).click()

    const pflichtfeldErrors = page.getByText('Pflichtfeld')
    await expect(pflichtfeldErrors).toHaveCount(3)
    await expect(page.getByText('Mindestens 5 Zeichen')).toBeVisible()
  })

  test('zeigt Fehler bei zu kurzer Beschreibung', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Auftraggeber' }).fill('Kunde A')
    await page.getByLabel(/Auftragsnr/i).fill('AU-001')
    await page.getByLabel('Zeitkonto').fill('ZK-01')
    await page.getByRole('textbox', { name: 'Beschreibung' }).fill('Hi')
    await page.getByRole('button', { name: 'Speichern' }).click()

    await expect(page.getByText('Mindestens 5 Zeichen')).toBeVisible()
    await expect(page.getByText('Noch keine Zeiten erfasst')).toBeVisible()
  })

  test('zeigt Fehler wenn Ende vor Start liegt', async ({ page }) => {
    await fillNewEntry(page, { start: '10:00', end: '09:00' })
    await page.getByRole('button', { name: 'Speichern' }).click()

    await expect(page.getByText('Ende muss nach Start liegen')).toBeVisible()
    await expect(page.getByText('Noch keine Zeiten erfasst')).toBeVisible()
  })
})
