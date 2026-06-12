import { create } from 'zustand'

interface RefreshStore {
  jiraVersion: number
  prVersion: number
  taskVersion: number
  zeitVersion: number
  incrementJira: () => void
  incrementPr: () => void
  incrementTask: () => void
  incrementZeit: () => void
}

export const useRefreshStore = create<RefreshStore>((set) => ({
  jiraVersion: 0,
  prVersion: 0,
  taskVersion: 0,
  zeitVersion: 0,
  incrementJira: () => set(s => ({ jiraVersion: s.jiraVersion + 1 })),
  incrementPr:   () => set(s => ({ prVersion:   s.prVersion   + 1 })),
  incrementTask: () => set(s => ({ taskVersion: s.taskVersion + 1 })),
  incrementZeit: () => set(s => ({ zeitVersion: s.zeitVersion + 1 })),
}))
