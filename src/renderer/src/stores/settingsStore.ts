import { create } from 'zustand'
import { electronApi } from '@renderer/api/electronApi'
import { defaultSettings, type AppSettings } from '@shared/settings'

interface SettingsStoreState {
  settings: AppSettings
  loading: boolean
  saving: boolean
  loaded: boolean
  loadSettings: () => Promise<void>
  saveSettings: (settings: AppSettings) => Promise<AppSettings>
  resetSettings: () => Promise<AppSettings>
  setSettings: (settings: AppSettings) => void
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: defaultSettings,
  loading: false,
  saving: false,
  loaded: false,
  loadSettings: async () => {
    set({ loading: true })
    try {
      const settings = await electronApi.getSettings()
      set({ settings, loaded: true })
    } finally {
      set({ loading: false })
    }
  },
  saveSettings: async (settings) => {
    set({ saving: true })
    try {
      const saved = await electronApi.saveSettings(settings)
      set({ settings: saved, loaded: true })
      return saved
    } finally {
      set({ saving: false })
    }
  },
  resetSettings: async () => {
    set({ saving: true })
    try {
      const reset = await electronApi.resetSettings()
      set({ settings: reset, loaded: true })
      return reset
    } finally {
      set({ saving: false })
    }
  },
  setSettings: (settings) => set({ settings, loaded: true })
}))
