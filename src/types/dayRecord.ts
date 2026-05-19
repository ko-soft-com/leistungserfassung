export interface DayRecord {
  date: string          // 'YYYY-MM-DD'
  workStart?: string    // 'HH:MM'
  workEnd?: string      // 'HH:MM'
  pauseMinutes: number  // default 0
}
