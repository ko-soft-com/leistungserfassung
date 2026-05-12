import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimerDraft {
  client: string
  orderNo: string
  account: string
}

interface ActiveTimer {
  startedAt: number
  draft: TimerDraft
}

interface TimerState {
  activeTimer: ActiveTimer | null
  startTimer: (draft: TimerDraft) => void
  stopTimer: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      activeTimer: null,
      startTimer: (draft) => set({ activeTimer: { startedAt: Date.now(), draft } }),
      stopTimer: () => set({ activeTimer: null }),
    }),
    { name: 'timesheet.activeTimer' }
  )
)
