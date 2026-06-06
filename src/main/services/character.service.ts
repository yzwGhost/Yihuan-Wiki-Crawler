import { readdir, readFile } from 'node:fs/promises'
import { basename, extname, isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  getCharactersDir,
  getImagesDir,
  resolveAppPath
} from '@main/services/path.service'
import type { CharacterDetail, CharacterSummary, DownloadedCharacterImage } from '@shared/character'

const EXCLUDED_FILES = new Set(['all_characters.json', 'candidate_links.json'])

interface CharacterFilePayload {
  name?: string
  url?: string
  default_sections?: Array<{ title?: string; lines?: string[] }>
  interactive_sections?: Array<{
    title?: string
    type?: string
    button_text?: string
    lines?: string[]
    images?: string[]
  }>
  images?: {
    urls?: string[]
    downloaded?: DownloadedCharacterImage[]
    download_failed?: Array<{ url?: string; error?: string }>
  }
}

function sanitizeName(value: string): string {
  const sanitized = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
  return sanitized || 'unknown-character'
}

function getImageDir(name: string): string {
  return resolve(getImagesDir(), sanitizeName(name))
}

async function readCharacterFileNames(): Promise<string[]> {
  try {
    const entries = await readdir(getCharactersDir(), { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => extname(name).toLowerCase() === '.json' && !EXCLUDED_FILES.has(name))
  } catch {
    return []
  }
}

async function readCharacterPayload(
  fileName: string
): Promise<{ fileName: string; jsonPath: string; rawJson: string; payload: CharacterFilePayload }> {
  const jsonPath = resolve(getCharactersDir(), fileName)
  const rawJson = await readFile(jsonPath, 'utf-8')
  const payload = JSON.parse(rawJson) as CharacterFilePayload
  return { fileName, jsonPath, rawJson, payload }
}

async function normalizeDownloadedImages(
  downloaded: DownloadedCharacterImage[] | undefined
): Promise<DownloadedCharacterImage[]> {
  return Promise.all(
    (downloaded ?? []).map(async (image) => {
      const absolutePath = isAbsolute(image.local_path) ? image.local_path : resolveAppPath(image.local_path)
      let previewSrc: string | undefined

      try {
        const fileBuffer = await readFile(absolutePath)
        const mimeType = image.content_type || 'image/png'
        previewSrc = `data:${mimeType};base64,${fileBuffer.toString('base64')}`
      } catch (error) {
        console.error(`[characters:detail] Failed to read preview image: ${absolutePath}`, error)
      }

      return {
        ...image,
        absolute_path: absolutePath,
        file_url: pathToFileURL(absolutePath).href,
        preview_src: previewSrc
      }
    })
  )
}

function toSummary(fileName: string, jsonPath: string, payload: CharacterFilePayload): CharacterSummary {
  const name = payload.name || basename(fileName, '.json')
  return {
    name,
    url: payload.url || '',
    defaultSectionCount: payload.default_sections?.length ?? 0,
    interactiveSectionCount: payload.interactive_sections?.length ?? 0,
    imageCount: payload.images?.downloaded?.length ?? 0,
    downloadFailedCount: payload.images?.download_failed?.length ?? 0,
    jsonFileName: fileName,
    jsonPath,
    imageDir: getImageDir(name)
  }
}

async function toDetail(
  fileName: string,
  jsonPath: string,
  rawJson: string,
  payload: CharacterFilePayload
): Promise<CharacterDetail> {
  const name = payload.name || basename(fileName, '.json')
  return {
    name,
    url: payload.url || '',
    default_sections: (payload.default_sections ?? []).map((section) => ({
      title: section.title || '未命名章节',
      lines: section.lines ?? []
    })),
    interactive_sections: (payload.interactive_sections ?? []).map((section) => ({
      title: section.title || section.button_text || '未命名交互章节',
      type: section.type || 'overlay',
      button_text: section.button_text || section.title || '未知按钮',
      lines: section.lines ?? [],
      images: section.images ?? []
    })),
    images: {
      urls: payload.images?.urls ?? [],
      downloaded: await normalizeDownloadedImages(payload.images?.downloaded),
      download_failed: (payload.images?.download_failed ?? []).map((item) => ({
        url: item.url || '',
        error: item.error || 'Unknown error'
      }))
    },
    jsonFileName: fileName,
    jsonPath,
    imageDir: getImageDir(name),
    rawJson
  }
}

export async function listCharacters(): Promise<CharacterSummary[]> {
  const fileNames = await readCharacterFileNames()
  const summaries: CharacterSummary[] = []

  for (const fileName of fileNames) {
    try {
      const { jsonPath, payload } = await readCharacterPayload(fileName)
      summaries.push(toSummary(fileName, jsonPath, payload))
    } catch (error) {
      console.error(`[characters:list] Failed to parse ${fileName}`, error)
    }
  }

  return summaries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
}

export async function getCharacterDetail(identifier: string): Promise<CharacterDetail> {
  const fileNames = await readCharacterFileNames()
  const directFileName = identifier.endsWith('.json') ? identifier : `${identifier}.json`

  if (fileNames.includes(directFileName)) {
    const { fileName, jsonPath, rawJson, payload } = await readCharacterPayload(directFileName)
    return toDetail(fileName, jsonPath, rawJson, payload)
  }

  for (const fileName of fileNames) {
    try {
      const { jsonPath, rawJson, payload } = await readCharacterPayload(fileName)
      const candidateName = payload.name || basename(fileName, '.json')
      if (candidateName === identifier || basename(fileName, '.json') === identifier) {
        return toDetail(fileName, jsonPath, rawJson, payload)
      }
    } catch (error) {
      console.error(`[characters:detail] Failed to parse ${fileName}`, error)
    }
  }

  throw new Error(`Character not found: ${identifier}`)
}
