export type JiraStatus = 'Offen' | 'In Progress' | 'In Code Review' | 'Done'

export const JIRA_STATUSES: readonly JiraStatus[] = [
  'Offen',
  'In Progress',
  'In Code Review',
  'Done',
]

export interface JiraTicket {
  id: string
  name: string
  status: JiraStatus
  kommentar: string
  createdAt: string
  updatedAt: string
}
