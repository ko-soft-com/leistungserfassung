import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  collapsedDays: string[]
  drawerOpen: boolean
  drawerEntryId: string | null
  toggleDay: (date: string) => void
  openDrawer: (id: string) => void
  closeDrawer: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      collapsedDays: [],
      drawerOpen: false,
      drawerEntryId: null,
      toggleDay: (date) => set(s => ({
        collapsedDays: s.collapsedDays.includes(date)
          ? s.collapsedDays.filter(d => d !== date)
          : [...s.collapsedDays, date],
      })),
      openDrawer: (id) => set({ drawerOpen: true, drawerEntryId: id }),
      closeDrawer: () => set({ drawerOpen: false, drawerEntryId: null }),
    }),
    { name: 'timesheet.ui', partialize: (s) => ({ collapsedDays: s.collapsedDays }) }
  )
)
