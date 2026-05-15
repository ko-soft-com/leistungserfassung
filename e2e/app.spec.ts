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

test.describe('Formular-UX', () => {
  test('Abbrechen setzt das Formular zurück', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Auftraggeber' }).fill('Test Kunde')
    await page.getByLabel(/Auftragsnr/i).fill('AU-999')
    await page.getByLabel('Zeitkonto').fill('ZK-99')

    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await expect(page.getByRole('textbox', { name: 'Auftraggeber' })).toHaveValue('')
    await expect(page.getByLabel(/Auftragsnr/i)).toHaveValue('')
    await expect(page.getByLabel('Zeitkonto')).toHaveValue('')
  })

  test('zeigt letzte-Vorschläge nach dem Speichern', async ({ page }) => {
    await fillNewEntry(page, {
      client: 'Stamm GmbH',
      orderNo: 'SG-001',
      account: 'DEV-01',
    })
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Stamm GmbH/ })).toBeVisible()

    const letzteButtons = page.getByRole('button', { name: 'letzte' })
    await expect(letzteButtons).toHaveCount(3)

    await letzteButtons.first().click()
    await expect(page.getByRole('textbox', { name: 'Auftraggeber' })).toHaveValue('Stamm GmbH')
  })

  test('Abbrechen im Bearbeiten-Drawer schließt den Drawer', async ({ page }) => {
    await fillNewEntry(page, { client: 'Edit Kandidat', description: 'Wird bearbeitet' })
    await page.getByRole('button', { name: 'Speichern' }).click()

    await page.getByRole('button', { name: /Eintrag bearbeiten: Edit Kandidat/ }).click()
    await expect(page.getByText('Eintrag bearbeiten')).toBeVisible()

    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole('button', { name: 'Abbrechen' }).click()

    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Eintrag bearbeiten: Edit Kandidat/ })).toBeVisible()
  })
})

test.describe('Zeit und Dauer', () => {
  test('Dauer-Dropdown berechnet Endzeit aus Startzeit', async ({ page }) => {
    await page.getByLabel(/^Start$/i).fill('09:00')
    await page.locator('#duration-select').selectOption('60')
    await expect(page.getByLabel(/^Ende$/i)).toHaveValue('10:00')
  })

  test('Dauer-Dropdown 0:15 h setzt Ende auf Start + 15 Minuten', async ({ page }) => {
    await page.getByLabel(/^Start$/i).fill('08:00')
    await page.locator('#duration-select').selectOption('15')
    await expect(page.getByLabel(/^Ende$/i)).toHaveValue('08:15')
  })
})
