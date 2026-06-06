import { ipcMain } from 'electron'
import { resolveAppPath } from '@main/services/path.service'
import { getTaskDetail, listTasks } from '@main/services/task.service'
import { PythonService } from '@main/services/python.service'
import { getSettings } from '@main/services/settings.service'

export function registerTasksIpc(pythonService: PythonService): void {
  ipcMain.removeHandler('tasks:list')
  ipcMain.removeHandler('tasks:detail')
  ipcMain.removeHandler('tasks:resume')
  ipcMain.removeHandler('tasks:retryFailedCharacters')
  ipcMain.removeHandler('tasks:retryFailedImages')

  ipcMain.handle('tasks:list', async () => {
    return listTasks()
  })

  ipcMain.handle('tasks:detail', async (_event, taskId: string) => {
    return getTaskDetail(taskId)
  })

  ipcMain.handle('tasks:resume', async (_event, taskId: string) => {
    if (pythonService.isRunning()) {
      throw new Error('Crawler process is already running.')
    }
    const settings = await getSettings()
    pythonService.resumeTask(taskId, {
      ...settings,
      outputDir: resolveAppPath(settings.outputDir)
    })
  })

  ipcMain.handle('tasks:retryFailedCharacters', async (_event, taskId: string) => {
    if (pythonService.isRunning()) {
      throw new Error('Crawler process is already running.')
    }
    const settings = await getSettings()
    pythonService.retryFailedCharacters(taskId, {
      ...settings,
      outputDir: resolveAppPath(settings.outputDir)
    })
  })

  ipcMain.handle('tasks:retryFailedImages', async (_event, taskId: string) => {
    if (pythonService.isRunning()) {
      throw new Error('Crawler process is already running.')
    }
    const settings = await getSettings()
    pythonService.retryFailedImages(taskId, {
      ...settings,
      outputDir: resolveAppPath(settings.outputDir)
    })
  })
}
