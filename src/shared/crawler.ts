export type CrawlerMode = 'single' | 'all'

export interface CrawlerStartOptions {
  mode: CrawlerMode
  url?: string
  outputDir: string
  downloadImages: boolean
  headless: boolean
  maxClick: number
  pageWait: number
  clickWait: number
  resume?: boolean
}

export interface CrawlerMessage {
  type: 'log' | 'progress' | 'done' | 'stderr' | 'error'
  message: string
  timestamp: string
  eventType?: string
  current?: number
  total?: number
  success?: number
  failed?: number
  url?: string
  name?: string
}

export interface CrawlerDonePayload {
  success: number
  failed: number
  timestamp: string
}

export interface CrawlerErrorPayload {
  message: string
  timestamp: string
}
