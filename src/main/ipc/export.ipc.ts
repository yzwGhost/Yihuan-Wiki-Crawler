import { dialog, ipcMain } from 'electron'
import { resolveDataPaths, resolveFromProjectRoot } from '@main/services/path.service'
import {
  exportAllCsv,
  exportAllJson,
  exportSingleJson,
  exportSingleMarkdown,
  openExportDir
} from '@main/services/export.service'
import { getSettings } from '@main/services/settings.service'

export function registerExportIpc(): void {
  ipcMain.removeHandler('export:allJson')
  ipcMain.removeHandler('export:singleJson')
  ipcMain.removeHandler('export:allCsv')
  ipcMain.removeHandler('export:singleMarkdown')
  ipcMain.removeHandler('export:openExportDir')
  ipcMain.removeHandler('export:selectExportDir')

  ipcMain.handle('export:allJson', async () => exportAllJson())
  ipcMain.handle('export:singleJson', async (_event, name: string) => exportSingleJson(name))
  ipcMain.handle('export:allCsv', async () => exportAllCsv())
  ipcMain.handle('export:singleMarkdown', async (_event, name: string) => exportSingleMarkdown(name))
  ipcMain.handle('export:openExportDir', async () => openExportDir())
  ipcMain.handle('export:selectExportDir', async () => {
    const settings = await getSettings()
    const { projectRoot } = await resolveDataPaths()
    const result = await dialog.showOpenDialog({
      title: '选择导出目录',
      defaultPath: resolveFromProjectRoot(projectRoot, settings.exportDir),
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })
}
