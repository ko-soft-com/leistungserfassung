export interface WorkSegment {
  start: string
  end: string
  pauseOverride?: number  // minutes — overrides calculated gap before this segment
}

export interface DayRecord {
  date: string
  segments: WorkSegment[]
  // Legacy fields — kept for migration detection only, never written on save
  workStart?: string
  workEnd?: string
  pauseMinutes?: number
}
