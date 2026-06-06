import { ipcMain } from 'electron'
import { getSettings, resetSettings, saveSettings } from '@main/services/settings.service'
import type { AppSettings } from '@shared/settings'

export function registerSettingsIpc(): void {
  ipcMain.removeHandler('settings:get')
  ipcMain.removeHandler('settings:save')
  ipcMain.removeHandler('settings:reset')

  ipcMain.handle('settings:get', async () => getSettings())
  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => saveSettings(settings))
  ipcMain.handle('settings:reset', async () => resetSettings())
}
