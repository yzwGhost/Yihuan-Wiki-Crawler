import { app } from 'electron'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { TaskDetail, TaskSummary } from '@shared/task'

interface TaskFilePayload extends Omit<TaskDetail, 'rawJson'> {
  rawJson?: string
}

async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const directoryStat = await stat(targetPath)
    return directoryStat.isDirectory()
  } catch {
    return false
  }
}

async function resolveTasksPaths(): Promise<{ dataDir: string; tasksDir: string; tasksFile: string }> {
  const appPath = app.getAppPath()
  const projectRootCandidates = [
    process.cwd(),
    appPath,
    resolve(appPath, '..'),
    resolve(appPath, '..', '..')
  ]

  for (const projectRoot of projectRootCandidates) {
    const dataDir = resolve(projectRoot, 'data')
    const tasksDir = resolve(dataDir, 'tasks')
    if (await isDirectory(tasksDir)) {
      return {
        dataDir,
        tasksDir,
        tasksFile: resolve(tasksDir, 'tasks.json')
      }
    }
  }

  const fallbackDataDir = resolve(projectRootCandidates[0], 'data')
  return {
    dataDir: fallbackDataDir,
    tasksDir: resolve(fallbackDataDir, 'tasks'),
    tasksFile: resolve(fallbackDataDir, 'tasks', 'tasks.json')
  }
}

async function readTasks(): Promise<TaskFilePayload[]> {
  const { tasksFile } = await resolveTasksPaths()
  try {
    const rawJson = await readFile(tasksFile, 'utf-8')
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
  return tasks
    .map(toSummary)
    .sort((left, right) => right.started_at.localeCompare(left.started_at))
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
