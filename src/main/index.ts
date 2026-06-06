import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { registerCharactersIpc } from '@main/ipc/characters.ipc'
import { pythonService, registerCrawlerIpc } from '@main/ipc/crawler.ipc'
import { registerEnvIpc } from '@main/ipc/env.ipc'
import { registerExportIpc } from '@main/ipc/export.ipc'
import { registerFileIpc } from '@main/ipc/file.ipc'
import { registerSettingsIpc } from '@main/ipc/settings.ipc'
import { registerTasksIpc } from '@main/ipc/tasks.ipc'
import { ensureAppDataStructure } from '@main/services/path.service'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await ensureAppDataStructure()

  ipcMain.handle('app:ping', async (_event, message: string) => {
    return `pong: ${message}`
  })

  registerCrawlerIpc()
  registerCharactersIpc()
  registerEnvIpc()
  registerFileIpc()
  registerExportIpc()
  registerSettingsIpc()
  registerTasksIpc(pythonService)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
