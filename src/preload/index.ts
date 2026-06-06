import { contextBridge, ipcRenderer } from 'electron'
import type {
  CrawlerDonePayload,
  CrawlerErrorPayload,
  CrawlerMessage,
  CrawlerStartOptions
} from '@shared/crawler'
import type { ExportResult } from '@shared/export'
import type { CharacterDetail, CharacterSummary } from '@shared/character'
import type { AppSettings } from '@shared/settings'
import type { TaskDetail, TaskSummary } from '@shared/task'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const yihuanApi = {
  ping: async (message: string): Promise<string> => ipcRenderer.invoke('app:ping', message),
  startCrawler: async (options: CrawlerStartOptions): Promise<void> =>
    ipcRenderer.invoke('crawler:start', options),
  stopCrawler: async (): Promise<void> => ipcRenderer.invoke('crawler:stop'),
  getCharacters: async (): Promise<CharacterSummary[]> => ipcRenderer.invoke('characters:list'),
  getCharacterDetail: async (name: string): Promise<CharacterDetail> =>
    ipcRenderer.invoke('characters:detail', name),
  getTasks: async (): Promise<TaskSummary[]> => ipcRenderer.invoke('tasks:list'),
  getTaskDetail: async (taskId: string): Promise<TaskDetail> => ipcRenderer.invoke('tasks:detail', taskId),
  resumeTask: async (taskId: string): Promise<void> => ipcRenderer.invoke('tasks:resume', taskId),
  retryFailedCharacters: async (taskId: string): Promise<void> =>
    ipcRenderer.invoke('tasks:retryFailedCharacters', taskId),
  retryFailedImages: async (taskId: string): Promise<void> =>
    ipcRenderer.invoke('tasks:retryFailedImages', taskId),
  exportAllJson: async (): Promise<ExportResult> => ipcRenderer.invoke('export:allJson'),
  exportSingleJson: async (name: string): Promise<ExportResult> => ipcRenderer.invoke('export:singleJson', name),
  exportAllCsv: async (): Promise<ExportResult> => ipcRenderer.invoke('export:allCsv'),
  exportSingleMarkdown: async (name: string): Promise<ExportResult> =>
    ipcRenderer.invoke('export:singleMarkdown', name),
  openExportDir: async (): Promise<ExportResult> => ipcRenderer.invoke('export:openExportDir'),
  selectExportDir: async (): Promise<string | null> => ipcRenderer.invoke('export:selectExportDir'),
  getSettings: async (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: async (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:save', settings),
  resetSettings: async (): Promise<AppSettings> => ipcRenderer.invoke('settings:reset'),
  openPath: async (targetPath: string): Promise<void> => ipcRenderer.invoke('file:openPath', targetPath),
  onCrawlerMessage: (callback: (message: CrawlerMessage) => void): (() => void) =>
    subscribe('crawler:message', callback),
  onCrawlerDone: (callback: (payload: CrawlerDonePayload) => void): (() => void) =>
    subscribe('crawler:done', callback),
  onCrawlerError: (callback: (payload: CrawlerErrorPayload) => void): (() => void) =>
    subscribe('crawler:error', callback)
}

contextBridge.exposeInMainWorld('yihuanApi', yihuanApi)
