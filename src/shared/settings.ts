export interface AppSettings {
  pythonPath: string
  outputDir: string
  exportDir: string
  downloadImages: boolean
  headless: boolean
  maxClick: number
  pageWaitMs: number
  clickWaitMs: number
  resume: boolean
  verboseLogs: boolean
}

export const defaultSettings: AppSettings = {
  pythonPath: 'python',
  outputDir: 'data',
  exportDir: 'data/exports',
  downloadImages: true,
  headless: false,
  maxClick: 40,
  pageWaitMs: 3000,
  clickWaitMs: 1200,
  resume: false,
  verboseLogs: true
}
