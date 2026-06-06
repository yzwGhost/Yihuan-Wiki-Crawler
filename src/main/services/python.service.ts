import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import readline from 'node:readline'
import { app } from 'electron'
import type {
  CrawlerDonePayload,
  CrawlerErrorPayload,
  CrawlerMessage,
  CrawlerStartOptions
} from '@shared/crawler'
import type { AppSettings } from '@shared/settings'

interface PythonServiceEvents {
  onMessage: (message: CrawlerMessage) => void
  onDone: (payload: CrawlerDonePayload) => void
  onError: (payload: CrawlerErrorPayload) => void
}

type PythonRuntimeSettings = Pick<
  AppSettings,
  'pythonPath' | 'outputDir' | 'downloadImages' | 'headless' | 'maxClick' | 'pageWaitMs' | 'clickWaitMs'
>

function now(): string {
  return new Date().toISOString()
}

export class PythonService {
  private crawlerProcess: ChildProcessWithoutNullStreams | null = null

  private stopping = false

  private completed = false

  constructor(private readonly events: PythonServiceEvents) {}

  isRunning(): boolean {
    return this.crawlerProcess !== null
  }

  start(options: CrawlerStartOptions, pythonPath?: string): void {
    const args = [
      '--mode',
      options.mode,
      '--output',
      options.outputDir || 'data',
      '--download-images',
      String(options.downloadImages),
      '--headless',
      String(options.headless),
      '--max-click',
      String(options.maxClick),
      '--page-wait',
      String(options.pageWait),
      '--click-wait',
      String(options.clickWait),
      '--resume',
      String(Boolean(options.resume))
    ]

    if (options.mode === 'single' && options.url?.trim()) {
      args.push('--url', options.url.trim())
    }

    this.startWithArgs(args, pythonPath)
  }

  resumeTask(taskId: string, settings: PythonRuntimeSettings): void {
    this.startWithArgs([
      '--mode',
      'all',
      '--output',
      settings.outputDir,
      '--download-images',
      String(settings.downloadImages),
      '--headless',
      String(settings.headless),
      '--max-click',
      String(settings.maxClick),
      '--page-wait',
      String(settings.pageWaitMs),
      '--click-wait',
      String(settings.clickWaitMs),
      '--resume',
      'true',
      '--resume-task-id',
      taskId
    ], settings.pythonPath)
  }

  retryFailedCharacters(taskId: string, settings: PythonRuntimeSettings): void {
    this.startWithArgs([
      '--output',
      settings.outputDir,
      '--download-images',
      String(settings.downloadImages),
      '--headless',
      String(settings.headless),
      '--max-click',
      String(settings.maxClick),
      '--page-wait',
      String(settings.pageWaitMs),
      '--click-wait',
      String(settings.clickWaitMs),
      '--retry-failed-task',
      taskId
    ], settings.pythonPath)
  }

  retryFailedImages(taskId: string, settings: PythonRuntimeSettings): void {
    this.startWithArgs([
      '--output',
      settings.outputDir,
      '--download-images',
      String(settings.downloadImages),
      '--headless',
      String(settings.headless),
      '--max-click',
      String(settings.maxClick),
      '--page-wait',
      String(settings.pageWaitMs),
      '--click-wait',
      String(settings.clickWaitMs),
      '--retry-failed-images',
      taskId
    ], settings.pythonPath)
  }

  stop(): void {
    if (!this.crawlerProcess) {
      return
    }

    this.stopping = true
    this.crawlerProcess.kill()
  }

  private resolveCrawlerScriptPath(): string {
    const directPath = join(app.getAppPath(), 'python', 'crawler', 'main.py')
    if (existsSync(directPath)) {
      return directPath
    }

    return join(process.cwd(), 'python', 'crawler', 'main.py')
  }

  private startWithArgs(extraArgs: string[], pythonPath?: string): void {
    if (this.crawlerProcess) {
      throw new Error('Crawler process is already running.')
    }

    const scriptPath = this.resolveCrawlerScriptPath()
    const pythonExecutable = pythonPath || process.env.YIHUAN_PYTHON_PATH || 'python'
    const args = [scriptPath, ...extraArgs]

    this.stopping = false
    this.completed = false
    this.crawlerProcess = spawn(pythonExecutable, args, {
      cwd: app.getAppPath(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    })

    this.crawlerProcess.stdout.setEncoding('utf8')
    this.crawlerProcess.stderr.setEncoding('utf8')

    this.bindOutput(this.crawlerProcess.stdout, 'stdout')
    this.bindOutput(this.crawlerProcess.stderr, 'stderr')

    this.crawlerProcess.on('error', (error) => {
      this.events.onError({
        message: `Failed to start crawler: ${error.message}`,
        timestamp: now()
      })
      this.crawlerProcess = null
    })

    this.crawlerProcess.on('close', (code, signal) => {
      const wasStopping = this.stopping
      this.crawlerProcess = null
      this.stopping = false

      if (wasStopping) {
        this.events.onMessage({
          type: 'log',
          message: 'Crawler process stopped.',
          timestamp: now()
        })
        return
      }

      if (this.completed) {
        return
      }

      if (code !== 0) {
        this.events.onError({
          message: `Crawler exited unexpectedly with code ${code ?? 'unknown'}${signal ? `, signal ${signal}` : ''}.`,
          timestamp: now()
        })
      }
    })
  }

  private bindOutput(stream: NodeJS.ReadableStream, source: 'stdout' | 'stderr'): void {
    const reader = readline.createInterface({ input: stream })

    reader.on('line', (line) => {
      if (!line.trim()) {
        return
      }

      if (source === 'stderr') {
        this.events.onMessage({
          type: 'stderr',
          message: line,
          timestamp: now()
        })
        return
      }

      try {
        const parsed = JSON.parse(line) as Partial<CrawlerMessage> &
          Partial<CrawlerDonePayload> & {
            error?: string
            name?: string
            url?: string
            type?: string
            total?: number
            task_id?: string
            status?: string
          }

        if (parsed.type === 'done') {
          this.completed = true
          this.events.onDone({
            success: parsed.success ?? 0,
            failed: parsed.failed ?? 0,
            timestamp: parsed.timestamp ?? now()
          })
          return
        }

        const eventType = parsed.type ?? 'log'
        const normalizedType: CrawlerMessage['type'] =
          eventType === 'progress'
            ? 'progress'
            : eventType === 'character_failed' || eventType === 'error' || eventType === 'image_failed'
              ? 'error'
              : 'log'

        let message = parsed.message ?? parsed.error ?? line
        if (eventType === 'character_done' && parsed.name) {
          message = `Character done: ${parsed.name}`
        } else if (eventType === 'character_failed' && parsed.url) {
          message = parsed.error ? `Character failed: ${parsed.url} - ${parsed.error}` : `Character failed: ${parsed.url}`
        } else if (eventType === 'image_failed' && parsed.url) {
          message = parsed.error ? `Image failed: ${parsed.url} - ${parsed.error}` : `Image failed: ${parsed.url}`
        } else if (eventType === 'discover_done') {
          message = parsed.message ?? `Discovered ${parsed.total ?? 0} character links.`
        } else if (eventType === 'task_created') {
          message = parsed.message ?? `Task created: ${parsed.task_id ?? ''}`.trim()
        } else if (eventType === 'task_updated') {
          message = parsed.message ?? `Task updated: ${parsed.task_id ?? ''} -> ${parsed.status ?? 'unknown'}`
        }

        this.events.onMessage({
          type: normalizedType,
          eventType,
          message,
          timestamp: parsed.timestamp ?? now(),
          current: parsed.current,
          total: parsed.total,
          success: parsed.success,
          failed: parsed.failed,
          url: parsed.url,
          name: parsed.name
        })
      } catch {
        this.events.onMessage({
          type: 'log',
          message: line,
          timestamp: now()
        })
      }
    })
  }
}
