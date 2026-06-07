import { BrowserWindow, ipcMain } from 'electron'
import type { WindowState } from '@shared/window'

const WINDOW_STATE_CHANNEL = 'window:stateChanged'

function getWindowState(window: BrowserWindow): WindowState {
  return {
    isMaximized: window.isMaximized()
  }
}

function emitWindowState(window: BrowserWindow): void {
  window.webContents.send(WINDOW_STATE_CHANNEL, getWindowState(window))
}

export function attachWindowStateEvents(window: BrowserWindow): void {
  window.on('maximize', () => emitWindowState(window))
  window.on('unmaximize', () => emitWindowState(window))
}

export function registerWindowIpc(): void {
  ipcMain.removeHandler('window:minimize')
  ipcMain.removeHandler('window:toggleMaximize')
  ipcMain.removeHandler('window:close')
  ipcMain.removeHandler('window:getState')

  ipcMain.handle('window:minimize', async (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:toggleMaximize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      return
    }

    if (window.isMaximized()) {
      window.unmaximize()
      return
    }

    window.maximize()
  })

  ipcMain.handle('window:close', async (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:getState', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window ? getWindowState(window) : { isMaximized: false }
  })
}
