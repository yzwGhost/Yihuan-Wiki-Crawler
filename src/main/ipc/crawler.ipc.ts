import { BrowserWindow, ipcMain } from 'electron'
import { resolveFromProjectRoot, resolveDataPaths } from '@main/services/path.service'
import { PythonService } from '@main/services/python.service'
import { getSettings } from '@main/services/settings.service'
import type {
  CrawlerDonePayload,
  CrawlerErrorPayload,
  CrawlerMessage,
  CrawlerStartOptions
} from '@shared/crawler'

const CRAWLER_MESSAGE_CHANNEL = 'crawler:message'
const CRAWLER_DONE_CHANNEL = 'crawler:done'
const CRAWLER_ERROR_CHANNEL = 'crawler:error'

function broadcast(channel: string, payload: CrawlerMessage | CrawlerDonePayload | CrawlerErrorPayload): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload)
  }
}

export const pythonService = new PythonService({
  onMessage: (message) => broadcast(CRAWLER_MESSAGE_CHANNEL, message),
  onDone: (payload) => broadcast(CRAWLER_DONE_CHANNEL, payload),
  onError: (payload) => broadcast(CRAWLER_ERROR_CHANNEL, payload)
})

export function registerCrawlerIpc(): void {
  ipcMain.removeHandler('crawler:start')
  ipcMain.removeHandler('crawler:stop')

  ipcMain.handle('crawler:start', async (_event, options: CrawlerStartOptions) => {
    if (pythonService.isRunning()) {
      throw new Error('Crawler process is already running.')
    }

    if (options.mode === 'single' && !options.url?.trim()) {
      throw new Error('Single mode requires a character URL.')
    }

    const settings = await getSettings()
    const { projectRoot } = await resolveDataPaths()

    pythonService.start({
      ...options,
      outputDir: resolveFromProjectRoot(projectRoot, options.outputDir || settings.outputDir),
      downloadImages: options.downloadImages,
      headless: options.headless,
      maxClick: options.maxClick,
      pageWait: options.pageWait,
      clickWait: options.clickWait,
      url: options.url?.trim()
    }, settings.pythonPath)
  })

  ipcMain.handle('crawler:stop', async () => {
    pythonService.stop()
  })
}
