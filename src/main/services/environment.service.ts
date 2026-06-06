import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import {
  getAppDataDir,
  getPythonCrawlerScriptPath,
  getPythonExecutablePath,
  getSettingsPath,
  resolveAppPath
} from '@main/services/path.service'
import { spawnPythonProcess } from '@main/services/python.service'
import { getSettings } from '@main/services/settings.service'
import type { EnvironmentCheckResult } from '@shared/environment'

async function canWriteFile(targetPath: string): Promise<boolean> {
  const probePath = join(dirname(targetPath), '.write-settings-test.tmp')
  try {
    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(probePath, 'ok', 'utf-8')
    await readFile(probePath, 'utf-8')
    await unlink(probePath).catch(() => undefined)
    return true
  } catch {
    return false
  }
}

async function canWriteDirectory(targetDir: string): Promise<boolean> {
  const probePath = join(targetDir, '.write-test.tmp')
  try {
    await mkdir(targetDir, { recursive: true })
    await writeFile(probePath, 'ok', 'utf-8')
    await readFile(probePath, 'utf-8')
    await unlink(probePath).catch(() => undefined)
    return true
  } catch {
    return false
  }
}

async function checkPlaywright(outputDir: string, pythonPath: string): Promise<{ available: boolean; message: string }> {
  try {
    const result = await spawnPythonProcess(['--output', outputDir, '--env-check'], pythonPath)
    const lines = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    const lastLine = lines.at(-1)
    if (!lastLine) {
      return { available: false, message: '未收到 Playwright 检查结果。' }
    }

    const payload = JSON.parse(lastLine) as {
      playwright_available?: boolean
      message?: string
    }

    return {
      available: Boolean(payload.playwright_available),
      message: payload.message || (payload.playwright_available ? 'Playwright 可用。' : 'Playwright 不可用。')
    }
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Playwright 检查失败。'
    }
  }
}

export async function checkEnvironment(): Promise<EnvironmentCheckResult> {
  const settings = await getSettings()
  const crawlerExecutablePath = getPythonExecutablePath(settings.pythonPath)
  const crawlerScriptPath = app.isPackaged ? undefined : getPythonCrawlerScriptPath()
  const outputDir = resolveAppPath(settings.outputDir)
  const settingsPath = getSettingsPath()
  const dataDir = getAppDataDir()
  const outputWritable = await canWriteDirectory(outputDir)
  const settingsWritable = await canWriteFile(settingsPath)
  const playwright = await checkPlaywright(outputDir, settings.pythonPath)

  const checks = [
    {
      name: '爬虫可执行文件',
      ok: existsSync(crawlerExecutablePath),
      message: crawlerExecutablePath
    },
    {
      name: '输出目录可写',
      ok: outputWritable,
      message: outputDir
    },
    {
      name: '设置文件可读写',
      ok: settingsWritable,
      message: settingsPath
    },
    {
      name: 'Playwright Chromium',
      ok: playwright.available,
      message: playwright.message
    }
  ]

  return {
    crawlerExecutablePath,
    crawlerScriptPath,
    dataDir,
    outputDir,
    settingsPath,
    isPackaged: app.isPackaged,
    crawlerExists: existsSync(crawlerExecutablePath),
    outputWritable,
    settingsWritable,
    playwrightAvailable: playwright.available,
    playwrightMessage: playwright.message,
    checks
  }
}
