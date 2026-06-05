export type PrStatus = 'Draft' | 'Open' | 'Merged' | 'Closed'

export const PR_STATUSES: readonly PrStatus[] = [
  'Draft',
  'Open',
  'Merged',
  'Closed',
]

export interface PullRequest {
  id: string
  nummer: string
  titel: string
  status: PrStatus
  kommentar: string
  createdAt: string
  updatedAt: string
}
