import { app } from 'electron'
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'

export interface DataPaths {
  projectRoot: string
  runtimeBaseDir: string
  dataDir: string
  charactersDir: string
  imagesDir: string
  exportsDir: string
  tasksDir: string
  taskLogsDir: string
  settingsFile: string
}

function getProjectRoot(): string {
  return process.cwd()
}

function getRuntimeBaseDir(): string {
  return app.isPackaged ? app.getPath('userData') : getProjectRoot()
}

export function getAppDataDir(): string {
  return join(getRuntimeBaseDir(), 'data')
}

export function getCharactersDir(): string {
  return join(getAppDataDir(), 'characters')
}

export function getImagesDir(): string {
  return join(getAppDataDir(), 'images')
}

export function getExportsDir(): string {
  return join(getAppDataDir(), 'exports')
}

export function getTasksDir(): string {
  return join(getAppDataDir(), 'tasks')
}

export function getTaskLogsDir(): string {
  return join(getTasksDir(), 'logs')
}

export function getSettingsPath(): string {
  return join(getAppDataDir(), 'settings.json')
}

export function getTasksFilePath(): string {
  return join(getTasksDir(), 'tasks.json')
}

export function resolveAppPath(targetPath: string): string {
  return isAbsolute(targetPath) ? targetPath : resolve(getRuntimeBaseDir(), targetPath)
}

export function resolveProjectPath(targetPath: string): string {
  return isAbsolute(targetPath) ? targetPath : resolve(getProjectRoot(), targetPath)
}

export function getPythonExecutablePath(configuredPythonPath?: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'python', 'yihuan-crawler.exe')
  }

  const projectRoot = getProjectRoot()
  const localPython = join(projectRoot, 'python', '.venv', 'Scripts', 'python.exe')
  if (existsSync(localPython)) {
    return localPython
  }

  const rootPython = join(projectRoot, '.venv', 'Scripts', 'python.exe')
  if (existsSync(rootPython)) {
    return rootPython
  }

  if (!configuredPythonPath) {
    return 'python'
  }

  const looksLikePath =
    configuredPythonPath.includes('\\') ||
    configuredPythonPath.includes('/') ||
    configuredPythonPath.startsWith('.')

  return looksLikePath ? resolveProjectPath(configuredPythonPath) : configuredPythonPath
}

export function getPythonCrawlerScriptPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'python', 'yihuan-crawler.exe')
  }

  return join(getProjectRoot(), 'python', 'crawler', 'main.py')
}

export function getPackagedPythonDir(): string {
  return app.isPackaged ? join(process.resourcesPath, 'python') : join(getProjectRoot(), 'resources', 'python')
}

export function getDataBaseDir(): string {
  return dirname(getAppDataDir())
}

export async function resolveDataPaths(): Promise<DataPaths> {
  return {
    projectRoot: getProjectRoot(),
    runtimeBaseDir: getRuntimeBaseDir(),
    dataDir: getAppDataDir(),
    charactersDir: getCharactersDir(),
    imagesDir: getImagesDir(),
    exportsDir: getExportsDir(),
    tasksDir: getTasksDir(),
    taskLogsDir: getTaskLogsDir(),
    settingsFile: getSettingsPath()
  }
}
