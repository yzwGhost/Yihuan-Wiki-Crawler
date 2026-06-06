import { app } from 'electron'
import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'

export interface DataPaths {
  projectRoot: string
  dataDir: string
  charactersDir: string
  imagesDir: string
  tasksDir: string
  exportsDir: string
  settingsFile: string
}

async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}

export async function resolveDataPaths(): Promise<DataPaths> {
  const appPath = app.getAppPath()
  const projectRootCandidates = [process.cwd(), appPath, resolve(appPath, '..'), resolve(appPath, '..', '..')]

  for (const projectRoot of projectRootCandidates) {
    const dataDir = resolve(projectRoot, 'data')
    if (await isDirectory(dataDir)) {
      return {
        projectRoot,
        dataDir,
        charactersDir: resolve(dataDir, 'characters'),
        imagesDir: resolve(dataDir, 'images'),
        tasksDir: resolve(dataDir, 'tasks'),
        exportsDir: resolve(dataDir, 'exports'),
        settingsFile: resolve(dataDir, 'settings.json')
      }
    }
  }

  const projectRoot = projectRootCandidates[0]
  const dataDir = resolve(projectRoot, 'data')
  return {
    projectRoot,
    dataDir,
    charactersDir: resolve(dataDir, 'characters'),
    imagesDir: resolve(dataDir, 'images'),
    tasksDir: resolve(dataDir, 'tasks'),
    exportsDir: resolve(dataDir, 'exports'),
    settingsFile: resolve(dataDir, 'settings.json')
  }
}

export function resolveFromProjectRoot(projectRoot: string, targetPath: string): string {
  return isAbsolute(targetPath) ? targetPath : resolve(projectRoot, targetPath)
}
