import type { TimeEntry } from '../../types/entry'

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))].sort()
}

export function buildSuggestions(entries: TimeEntry[]) {
  return {
    client:      uniq(entries.map(e => e.client)),
    orderNo:     uniq(entries.map(e => e.orderNo)),
    account:     uniq(entries.map(e => e.account)),
    description: uniq(entries.map(e => e.description).filter(d => d.length > 1)),
    jira:        uniq(entries.map(e => e.jira ?? '')),
    pr:          uniq(entries.map(e => e.pr ?? '')),
  }
}

const KEYS = {
  client: 'timesheet.lastClient',
  orderNo: 'timesheet.lastOrderNo',
  account: 'timesheet.lastAccount',
} as const

export function getLastUsed(): { client: string; orderNo: string; account: string } {
  return {
    client: localStorage.getItem(KEYS.client) ?? '',
    orderNo: localStorage.getItem(KEYS.orderNo) ?? '',
    account: localStorage.getItem(KEYS.account) ?? '',
  }
}

export function setLastUsed(values: { client: string; orderNo: string; account: string }) {
  if (values.client) localStorage.setItem(KEYS.client, values.client)
  if (values.orderNo) localStorage.setItem(KEYS.orderNo, values.orderNo)
  if (values.account) localStorage.setItem(KEYS.account, values.account)
}
