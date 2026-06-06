import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { ipcMain, shell } from 'electron'

function resolveLocalPath(targetPath: string): string {
  return isAbsolute(targetPath) ? targetPath : resolve(process.cwd(), targetPath)
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
