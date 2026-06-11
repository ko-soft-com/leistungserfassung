export type TaskStatus = 'Geplant' | 'In Arbeit' | 'Fertig'

export const TASK_STATUSES: readonly TaskStatus[] = ['Geplant', 'In Arbeit', 'Fertig']

export interface TaskHistoryEntry {
  timestamp: string
  von: TaskStatus
  nach: TaskStatus
}

export interface Task {
  id: string
  titel: string
  beschreibung: string
  status: TaskStatus
  startedAt: string | null
  endedAt: string | null
  jiraTicketId: string | null
  pullRequestId: string | null
  history: TaskHistoryEntry[]
  faelligkeitsdatum: string | null
  createdAt: string
  updatedAt: string
}
