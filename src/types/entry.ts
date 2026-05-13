export type TaskType = string

export interface TimeEntry {
  id: string
  date: string          // 'YYYY-MM-DD'
  start: string | null   // null = no start time recorded
  end: string | null    // null = timer running
  client: string
  orderNo: string
  account: string
  task: TaskType
  description: string
  externalId?: string
  jira?: string
  pr?: string
  createdAt: string
  updatedAt: string
}

// Legacy — used by V1 components until Tasks 7-9 replace them
export interface Dauer {
  stunden: number
  minuten: number
}

export interface Eintrag {
  id: string
  auftraggeber: string
  auftragsnummer: string
  auftrag: string
  zeitkonto: string
  aufgabe: string
  datum: string
  dauer: Dauer
  beschreibung?: string
  externeId?: string
  jiraTicket?: string
  prLink?: string
  startzeit?: string
  endzeit?: string
  createdAt: number
}

export type EintragFormData = Omit<Eintrag, 'id' | 'createdAt'>
