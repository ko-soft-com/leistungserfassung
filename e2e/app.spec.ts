import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('shows empty state when no entries', async ({ page }) => {
  await expect(page.getByText(/Noch keine Einträge/i)).toBeVisible()
})

test('adds a new entry and displays it in the table', async ({ page }) => {
  await page.getByLabel('Auftraggeber', { exact: false }).fill('Kunde A')
  await page.getByLabel('Auftragsnummer', { exact: false }).fill('AU-001')
  await page.locator('#auftrag').fill('Website Redesign')
  await page.getByLabel('Zeitkonto', { exact: false }).fill('ZK-01')
  await page.getByLabel('Aufgabe', { exact: false }).fill('Frontend')
  await page.getByLabel('Stunden', { exact: false }).fill('2')
  await page.getByLabel('Minuten', { exact: false }).fill('30')

  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByText('Kunde A')).toBeVisible()
  await expect(page.getByText('AU-001')).toBeVisible()
  await expect(page.getByText('2h 30m')).toBeVisible()
  await expect(page.getByLabel('Auftraggeber', { exact: false })).toHaveValue('')
})

test('edits an existing entry', async ({ page }) => {
  await page.getByLabel('Auftraggeber', { exact: false }).fill('Kunde A')
  await page.getByLabel('Auftragsnummer', { exact: false }).fill('AU-001')
  await page.locator('#auftrag').fill('Website')
  await page.getByLabel('Zeitkonto', { exact: false }).fill('ZK-01')
  await page.getByLabel('Aufgabe', { exact: false }).fill('Frontend')
  await page.getByLabel('Stunden', { exact: false }).fill('1')
  await page.getByLabel('Minuten', { exact: false }).fill('0')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await page.getByRole('button', { name: 'Bearbeiten' }).click()

  await expect(page.getByLabel('Auftraggeber', { exact: false })).toHaveValue('Kunde A')

  await page.getByLabel('Auftraggeber', { exact: false }).fill('Kunde B')
  await page.getByRole('button', { name: 'Aktualisieren' }).click()

  await expect(page.getByText('Kunde B')).toBeVisible()
  await expect(page.getByText('Kunde A')).not.toBeVisible()
})

test('deletes an entry', async ({ page }) => {
  await page.getByLabel('Auftraggeber', { exact: false }).fill('Zu löschen')
  await page.getByLabel('Auftragsnummer', { exact: false }).fill('DEL-001')
  await page.locator('#auftrag').fill('Delete Me')
  await page.getByLabel('Zeitkonto', { exact: false }).fill('ZK-01')
  await page.getByLabel('Aufgabe', { exact: false }).fill('Test')
  await page.getByLabel('Stunden', { exact: false }).fill('0')
  await page.getByLabel('Minuten', { exact: false }).fill('15')
  await page.getByRole('button', { name: 'Speichern' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Löschen' }).click()

  await expect(page.getByText(/Noch keine Einträge/i)).toBeVisible()
})
