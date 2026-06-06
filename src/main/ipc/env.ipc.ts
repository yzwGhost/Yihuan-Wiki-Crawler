import { ipcMain } from 'electron'
import { checkEnvironment } from '@main/services/environment.service'

export function registerEnvIpc(): void {
  ipcMain.removeHandler('env:check')
  ipcMain.handle('env:check', async () => checkEnvironment())
}
