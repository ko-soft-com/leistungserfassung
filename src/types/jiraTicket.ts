import type { JiraIssueType } from './entry'
export type { JiraIssueType }
export { JIRA_ISSUE_TYPES } from './entry'

export type JiraStatus = 'Offen' | 'In Progress' | 'In Code Review' | 'Done'

export const JIRA_STATUSES: readonly JiraStatus[] = [
  'Offen',
  'In Progress',
  'In Code Review',
  'Done',
]

export interface JiraTicket {
  id: string
  nummer: string
  titel: string
  issueType: JiraIssueType
  status: JiraStatus
  beschreibung: string
  kommentar: string
  createdAt: string
  updatedAt: string
}
