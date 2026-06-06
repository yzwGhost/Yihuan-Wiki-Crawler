import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolveDataPaths } from '@main/services/path.service'
import { defaultSettings, type AppSettings } from '@shared/settings'

function normalizeSettings(settings: Partial<AppSettings> | null | undefined): AppSettings {
  const merged: AppSettings = {
    ...defaultSettings,
    ...(settings ?? {})
  }

  return {
    ...merged,
    pythonPath: merged.pythonPath || defaultSettings.pythonPath,
    outputDir: merged.outputDir || defaultSettings.outputDir,
    exportDir: merged.exportDir || defaultSettings.exportDir,
    maxClick: Number.isFinite(merged.maxClick) ? merged.maxClick : defaultSettings.maxClick,
    pageWaitMs: Number.isFinite(merged.pageWaitMs) ? merged.pageWaitMs : defaultSettings.pageWaitMs,
    clickWaitMs: Number.isFinite(merged.clickWaitMs) ? merged.clickWaitMs : defaultSettings.clickWaitMs
  }
}

async function writeSettings(settings: AppSettings): Promise<void> {
  const { settingsFile } = await resolveDataPaths()
  await mkdir(dirname(settingsFile), { recursive: true })
  await writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8')
}

export async function getSettings(): Promise<AppSettings> {
  const { settingsFile } = await resolveDataPaths()

  try {
    const rawJson = await readFile(settingsFile, 'utf-8')
    const parsed = JSON.parse(rawJson) as Partial<AppSettings>
    return normalizeSettings(parsed)
  } catch {
    return normalizeSettings(defaultSettings)
  }
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(settings)
  await writeSettings(normalized)
  return normalized
}

export async function resetSettings(): Promise<AppSettings> {
  const normalized = normalizeSettings(defaultSettings)
  await writeSettings(normalized)
  return normalized
}
