export interface CharacterSection {
  title: string
  lines: string[]
}

export interface InteractiveCharacterSection extends CharacterSection {
  type: string
  button_text: string
  images: string[]
}

export interface DownloadedCharacterImage {
  url: string
  local_path: string
  content_type: string
  status: string
  absolute_path?: string
  file_url?: string
  preview_src?: string
}

export interface FailedCharacterImage {
  url: string
  error: string
}

export interface CharacterImagesPayload {
  urls: string[]
  downloaded: DownloadedCharacterImage[]
  download_failed: FailedCharacterImage[]
}

export interface CharacterDetail {
  name: string
  url: string
  default_sections: CharacterSection[]
  interactive_sections: InteractiveCharacterSection[]
  images: CharacterImagesPayload
  jsonFileName: string
  jsonPath: string
  imageDir: string
  rawJson: string
}

export interface CharacterSummary {
  name: string
  url: string
  defaultSectionCount: number
  interactiveSectionCount: number
  imageCount: number
  downloadFailedCount: number
  jsonFileName: string
  jsonPath: string
  imageDir: string
}
