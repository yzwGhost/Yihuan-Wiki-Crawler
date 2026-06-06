export interface EnvironmentCheckResult {
  crawlerExecutablePath: string
  crawlerScriptPath?: string
  dataDir: string
  outputDir: string
  settingsPath: string
  isPackaged: boolean
  crawlerExists: boolean
  outputWritable: boolean
  settingsWritable: boolean
  playwrightAvailable: boolean
  playwrightMessage: string
  checks: Array<{
    name: string
    ok: boolean
    message: string
  }>
}
