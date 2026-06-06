import { stat } from 'node:fs/promises'
import { ipcMain, shell } from 'electron'
import { resolveAppPath } from '@main/services/path.service'

function resolveLocalPath(targetPath: string): string {
  return resolveAppPath(targetPath)
}

export function registerFileIpc(): void {
  ipcMain.removeHandler('file:openPath')

  ipcMain.handle('file:openPath', async (_event, targetPath: string) => {
    const resolvedPath = resolveLocalPath(targetPath)
    await stat(resolvedPath)
    const error = await shell.openPath(resolvedPath)
    if (error) {
      throw new Error(error)
    }
  })
}
