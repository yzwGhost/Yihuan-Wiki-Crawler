import type {
  CrawlerDonePayload,
  CrawlerErrorPayload,
  CrawlerMessage,
  CrawlerStartOptions
} from '@shared/crawler'
import type { CharacterDetail, CharacterSummary } from '@shared/character'
import type { ExportResult } from '@shared/export'
import type { EnvironmentCheckResult } from '@shared/environment'
import type { AppSettings } from '@shared/settings'
import type { TaskDetail, TaskSummary } from '@shared/task'

interface YihuanApi {
  ping: (message: string) => Promise<string>
  startCrawler: (options: CrawlerStartOptions) => Promise<void>
  stopCrawler: () => Promise<void>
  getCharacters: () => Promise<CharacterSummary[]>
  getCharacterDetail: (name: string) => Promise<CharacterDetail>
  getTasks: () => Promise<TaskSummary[]>
  getTaskDetail: (taskId: string) => Promise<TaskDetail>
  resumeTask: (taskId: string) => Promise<void>
  retryFailedCharacters: (taskId: string) => Promise<void>
  retryFailedImages: (taskId: string) => Promise<void>
  exportAllJson: () => Promise<ExportResult>
  exportSingleJson: (name: string) => Promise<ExportResult>
  exportAllCsv: () => Promise<ExportResult>
  exportSingleMarkdown: (name: string) => Promise<ExportResult>
  openExportDir: () => Promise<ExportResult>
  selectExportDir: () => Promise<string | null>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<AppSettings>
  resetSettings: () => Promise<AppSettings>
  checkEnvironment: () => Promise<EnvironmentCheckResult>
  openPath: (targetPath: string) => Promise<void>
  onCrawlerMessage: (callback: (message: CrawlerMessage) => void) => () => void
  onCrawlerDone: (callback: (payload: CrawlerDonePayload) => void) => () => void
  onCrawlerError: (callback: (payload: CrawlerErrorPayload) => void) => () => void
}

declare global {
  interface Window {
    yihuanApi: YihuanApi
  }
}

export {}
