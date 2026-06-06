import { create } from 'zustand'

export type PageKey =
  | 'dashboard'
  | 'tasks'
  | 'taskHistory'
  | 'profiles'
  | 'images'
  | 'exports'
  | 'settings'

interface AppState {
  activePage: PageKey
  setActivePage: (page: PageKey) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page })
}))
