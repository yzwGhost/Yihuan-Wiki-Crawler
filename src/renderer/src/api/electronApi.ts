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

export const electronApi = {
  ping: (message: string): Promise<string> => window.yihuanApi.ping(message),
  startCrawler: (options: CrawlerStartOptions): Promise<void> => window.yihuanApi.startCrawler(options),
  stopCrawler: (): Promise<void> => window.yihuanApi.stopCrawler(),
  getCharacters: (): Promise<CharacterSummary[]> => window.yihuanApi.getCharacters(),
  getCharacterDetail: (name: string): Promise<CharacterDetail> => window.yihuanApi.getCharacterDetail(name),
  getTasks: (): Promise<TaskSummary[]> => window.yihuanApi.getTasks(),
  getTaskDetail: (taskId: string): Promise<TaskDetail> => window.yihuanApi.getTaskDetail(taskId),
  resumeTask: (taskId: string): Promise<void> => window.yihuanApi.resumeTask(taskId),
  retryFailedCharacters: (taskId: string): Promise<void> => window.yihuanApi.retryFailedCharacters(taskId),
  retryFailedImages: (taskId: string): Promise<void> => window.yihuanApi.retryFailedImages(taskId),
  exportAllJson: (): Promise<ExportResult> => window.yihuanApi.exportAllJson(),
  exportSingleJson: (name: string): Promise<ExportResult> => window.yihuanApi.exportSingleJson(name),
  exportAllCsv: (): Promise<ExportResult> => window.yihuanApi.exportAllCsv(),
  exportSingleMarkdown: (name: string): Promise<ExportResult> => window.yihuanApi.exportSingleMarkdown(name),
  openExportDir: (): Promise<ExportResult> => window.yihuanApi.openExportDir(),
  selectExportDir: (): Promise<string | null> => window.yihuanApi.selectExportDir(),
  getSettings: (): Promise<AppSettings> => window.yihuanApi.getSettings(),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => window.yihuanApi.saveSettings(settings),
  resetSettings: (): Promise<AppSettings> => window.yihuanApi.resetSettings(),
  checkEnvironment: (): Promise<EnvironmentCheckResult> => window.yihuanApi.checkEnvironment(),
  openPath: (targetPath: string): Promise<void> => window.yihuanApi.openPath(targetPath),
  onCrawlerMessage: (callback: (message: CrawlerMessage) => void): (() => void) =>
    window.yihuanApi.onCrawlerMessage(callback),
  onCrawlerDone: (callback: (payload: CrawlerDonePayload) => void): (() => void) =>
    window.yihuanApi.onCrawlerDone(callback),
  onCrawlerError: (callback: (payload: CrawlerErrorPayload) => void): (() => void) =>
    window.yihuanApi.onCrawlerError(callback)
}
