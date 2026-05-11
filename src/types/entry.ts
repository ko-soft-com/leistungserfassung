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
  createdAt: number
}

export type EintragFormData = Omit<Eintrag, 'id' | 'createdAt'>
