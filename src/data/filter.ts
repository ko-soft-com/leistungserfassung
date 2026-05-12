import type { TimeEntry } from '../types/entry'

export interface FilterOptions {
  range?: 'today' | 'week' | 'month' | 'custom'
  from?: string
  to?: string
  search?: string
  client?: string
}

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
    const today = new Date().toISOString().slice(0, 10)
    result = result.filter(e => e.date === today)
  } else if (opts.range === 'week') {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    const from = weekStart.toISOString().slice(0, 10)
    const to = now.toISOString().slice(0, 10)
    result = result.filter(e => e.date >= from && e.date <= to)
  } else if (opts.range === 'month') {
    const prefix = new Date().toISOString().slice(0, 7)
    result = result.filter(e => e.date.startsWith(prefix))
  } else if (opts.range === 'custom' && opts.from && opts.to) {
    result = result.filter(e => e.date >= opts.from! && e.date <= opts.to!)
  }

  return result
}
