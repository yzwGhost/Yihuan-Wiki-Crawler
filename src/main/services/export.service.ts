import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { shell } from 'electron'
import { getCharacterDetail } from '@main/services/character.service'
import { getCharactersDir, resolveAppPath } from '@main/services/path.service'
import { getSettings } from '@main/services/settings.service'
import type { ExportResult } from '@shared/export'

const EXCLUDED_FILES = new Set(['all_characters.json', 'candidate_links.json'])

interface CharacterExportPayload {
  name?: string
  url?: string
  default_sections?: Array<{ title?: string; lines?: string[] }>
  interactive_sections?: Array<{ title?: string; button_text?: string; lines?: string[]; images?: string[] }>
  images?: {
    urls?: string[]
    downloaded?: Array<{ url?: string; local_path?: string }>
    download_failed?: Array<{ url?: string; error?: string }>
  }
}

async function ensureExportDir(): Promise<string> {
  const settings = await getSettings()
  const exportDir = resolveAppPath(settings.exportDir)
  await mkdir(exportDir, { recursive: true })
  return exportDir
}

async function readCharacterFileNames(): Promise<string[]> {
  try {
    const entries = await readdir(getCharactersDir(), { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => extname(name).toLowerCase() === '.json' && !EXCLUDED_FILES.has(name))
      .sort((left, right) => left.localeCompare(right, 'zh-CN'))
  } catch {
    return []
  }
}

async function readCharacterPayload(fileName: string): Promise<CharacterExportPayload> {
  const rawJson = await readFile(resolve(getCharactersDir(), fileName), 'utf-8')
  return JSON.parse(rawJson) as CharacterExportPayload
}

function csvEscape(value: string | number): string {
  const text = String(value ?? '')
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toMarkdown(detail: Awaited<ReturnType<typeof getCharacterDetail>>): string {
  const lines: string[] = [`# ${detail.name}`, `原始链接：${detail.url}`, '', '## 默认章节']

  for (const section of detail.default_sections) {
    lines.push(`### ${section.title}`)
    if (section.lines.length === 0) {
      lines.push('- 无')
    } else {
      lines.push(...section.lines.map((line) => `- ${line}`))
    }
    lines.push('')
  }

  lines.push('## 交互章节')
  for (const section of detail.interactive_sections) {
    lines.push(`### ${section.title}`)
    if (section.lines.length === 0) {
      lines.push('- 无')
    } else {
      lines.push(...section.lines.map((line) => `- ${line}`))
    }
    if (section.images.length > 0) {
      lines.push('- 章节图片')
      lines.push(...section.images.map((image) => `- ${image}`))
    }
    lines.push('')
  }

  lines.push('## 图片')
  if (detail.images.downloaded.length === 0 && detail.images.urls.length === 0) {
    lines.push('- 无')
  } else {
    for (const image of detail.images.downloaded) {
      lines.push(`- 本地路径：${image.local_path}`)
      lines.push(`- 原始 URL：${image.url}`)
    }
    for (const url of detail.images.urls) {
      if (!detail.images.downloaded.some((item) => item.url === url)) {
        lines.push(`- 原始 URL：${url}`)
      }
    }
  }

  return `${lines.join('\n')}\n`
}

export async function exportAllJson(): Promise<ExportResult> {
  const exportDir = await ensureExportDir()
  const fileNames = await readCharacterFileNames()
  const payloads = await Promise.all(fileNames.map((fileName) => readCharacterPayload(fileName)))
  const targetPath = resolve(exportDir, 'all_characters_export.json')
  await writeFile(targetPath, `${JSON.stringify(payloads, null, 2)}\n`, 'utf-8')
  return { path: targetPath }
}

export async function exportSingleJson(name: string): Promise<ExportResult> {
  const exportDir = await ensureExportDir()
  const detail = await getCharacterDetail(name)
  const targetPath = resolve(exportDir, `${detail.name}.json`)
  await copyFile(detail.jsonPath, targetPath)
  return { path: targetPath }
}

export async function exportAllCsv(): Promise<ExportResult> {
  const exportDir = await ensureExportDir()
  const fileNames = await readCharacterFileNames()
  const rows = await Promise.all(
    fileNames.map(async (fileName) => {
      const payload = await readCharacterPayload(fileName)
      return {
        name: payload.name || basename(fileName, '.json'),
        url: payload.url || '',
        default_section_count: payload.default_sections?.length ?? 0,
        interactive_section_count: payload.interactive_sections?.length ?? 0,
        image_count: payload.images?.urls?.length ?? 0,
        downloaded_image_count: payload.images?.downloaded?.length ?? 0,
        failed_image_count: payload.images?.download_failed?.length ?? 0
      }
    })
  )

  const header = [
    'name',
    'url',
    'default_section_count',
    'interactive_section_count',
    'image_count',
    'downloaded_image_count',
    'failed_image_count'
  ]

  const csvLines = [
    header.join(','),
    ...rows.map((row) =>
      [
        csvEscape(row.name),
        csvEscape(row.url),
        csvEscape(row.default_section_count),
        csvEscape(row.interactive_section_count),
        csvEscape(row.image_count),
        csvEscape(row.downloaded_image_count),
        csvEscape(row.failed_image_count)
      ].join(',')
    )
  ]

  const targetPath = resolve(exportDir, 'all_characters.csv')
  await writeFile(targetPath, `\uFEFF${csvLines.join('\n')}\n`, 'utf-8')
  return { path: targetPath }
}

export async function exportSingleMarkdown(name: string): Promise<ExportResult> {
  const exportDir = await ensureExportDir()
  const detail = await getCharacterDetail(name)
  const targetPath = resolve(exportDir, `${detail.name}.md`)
  await writeFile(targetPath, toMarkdown(detail), 'utf-8')
  return { path: targetPath }
}

export async function openExportDir(): Promise<ExportResult> {
  const exportDir = await ensureExportDir()
  const error = await shell.openPath(exportDir)
  if (error) {
    throw new Error(error)
  }
  return { path: exportDir }
}
