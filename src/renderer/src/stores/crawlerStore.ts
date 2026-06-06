import { create } from 'zustand'
import type { CrawlerMode } from '@shared/crawler'

export interface CrawlerLogItem {
  id: string
  level: 'log' | 'progress' | 'stderr' | 'done' | 'error'
  message: string
  timestamp: string
}

interface CrawlerState {
  running: boolean
  mode: CrawlerMode
  current: number
  total: number
  currentMessage: string
  logs: CrawlerLogItem[]
  successCount: number
  failedCount: number
  setRunning: (running: boolean) => void
  setMode: (mode: CrawlerMode) => void
  appendLog: (log: CrawlerLogItem) => void
  setProgress: (current: number, total: number, message: string) => void
  setResult: (success: number, failed: number) => void
  incrementSuccess: () => void
  incrementFailed: () => void
  resetLogs: () => void
}

export const useCrawlerStore = create<CrawlerState>((set) => ({
  running: false,
  mode: 'single',
  current: 0,
  total: 0,
  currentMessage: '',
  logs: [],
  successCount: 0,
  failedCount: 0,
  setRunning: (running) => set({ running }),
  setMode: (mode) => set({ mode }),
  appendLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log].slice(-200)
    })),
  setProgress: (current, total, message) =>
    set({
      current,
      total,
      currentMessage: message
    }),
  setResult: (success, failed) =>
    set({
      successCount: success,
      failedCount: failed
    }),
  incrementSuccess: () =>
    set((state) => ({
      successCount: state.successCount + 1
    })),
  incrementFailed: () =>
    set((state) => ({
      failedCount: state.failedCount + 1
    })),
  resetLogs: () =>
    set({
      current: 0,
      total: 0,
      currentMessage: '',
      logs: [],
      successCount: 0,
      failedCount: 0
    })
}))
