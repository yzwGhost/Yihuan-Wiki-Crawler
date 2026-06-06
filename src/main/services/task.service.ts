import { readFile } from 'node:fs/promises'
import { getTasksFilePath } from '@main/services/path.service'
import type { TaskDetail, TaskSummary } from '@shared/task'

interface TaskFilePayload extends Omit<TaskDetail, 'rawJson'> {
  rawJson?: string
}

async function readTasks(): Promise<TaskFilePayload[]> {
  try {
    const rawJson = await readFile(getTasksFilePath(), 'utf-8')
    const normalizedJson = rawJson.replace(/^\uFEFF/, '')
    const parsed = JSON.parse(normalizedJson)
    return Array.isArray(parsed) ? (parsed as TaskFilePayload[]) : []
  } catch (error) {
    console.error('[tasks:list] Failed to read tasks file', error)
    return []
  }
}

function toSummary(task: TaskFilePayload): TaskSummary {
  return {
    task_id: task.task_id,
    mode: task.mode,
    status: task.status,
    total: task.total,
    success_count: task.success_count,
    failed_count: task.failed_count,
    started_at: task.started_at,
    finished_at: task.finished_at,
    log_path: task.log_path
  }
}

export async function listTasks(): Promise<TaskSummary[]> {
  const tasks = await readTasks()
  return tasks.map(toSummary).sort((left, right) => right.started_at.localeCompare(left.started_at))
}

export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const tasks = await readTasks()
  const task = tasks.find((item) => item.task_id === taskId)
  if (!task) {
    throw new Error(`Task not found: ${taskId}`)
  }

  return {
    task_id: task.task_id,
    mode: task.mode,
    status: task.status,
    total: task.total,
    success_count: task.success_count,
    failed_count: task.failed_count,
    started_at: task.started_at,
    finished_at: task.finished_at,
    success_urls: task.success_urls ?? [],
    failed_urls: task.failed_urls ?? [],
    failed_images: task.failed_images ?? [],
    log_path: task.log_path,
    rawJson: JSON.stringify(task, null, 2)
  }
}
