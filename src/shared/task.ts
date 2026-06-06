export type TaskMode = 'single' | 'all'

export type TaskStatus = 'running' | 'completed' | 'failed' | 'stopped'

export interface TaskFailedUrl {
  url: string
  error: string
}

export interface TaskFailedImage {
  character_name: string
  url: string
  error: string
}

export interface TaskSummary {
  task_id: string
  mode: TaskMode
  status: TaskStatus
  total: number
  success_count: number
  failed_count: number
  started_at: string
  finished_at: string | null
  log_path?: string
}

export interface TaskDetail extends TaskSummary {
  success_urls: string[]
  failed_urls: TaskFailedUrl[]
  failed_images: TaskFailedImage[]
  rawJson: string
}
