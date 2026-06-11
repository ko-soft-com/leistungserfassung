export type PrStatus = 'Draft' | 'Open' | 'Review in Progress' | 'Merged' | 'Closed'

export const PR_STATUSES: readonly PrStatus[] = [
  'Draft',
  'Open',
  'Review in Progress',
  'Merged',
  'Closed',
]

export interface PrHistoryEntry {
  timestamp: string
  von: PrStatus
  nach: PrStatus
}

export interface PullRequest {
  id: string
  nummer: string
  titel: string
  status: PrStatus
  reviewer: string
  kommentar: string
  history: PrHistoryEntry[]
  faelligkeitsdatum: string | null
  createdAt: string
  updatedAt: string
}
