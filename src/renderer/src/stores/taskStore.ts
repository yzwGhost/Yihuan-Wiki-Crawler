import { create } from 'zustand'
import { electronApi } from '@renderer/api/electronApi'
import type { TaskDetail, TaskSummary } from '@shared/task'

interface TaskStoreState {
  tasks: TaskSummary[]
  loading: boolean
  detailLoading: boolean
  selectedTask?: TaskDetail
  loadTasks: () => Promise<void>
  openTaskDetail: (taskId: string) => Promise<void>
  closeTaskDetail: () => void
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  tasks: [],
  loading: false,
  detailLoading: false,
  selectedTask: undefined,
  loadTasks: async () => {
    set({ loading: true })
    try {
      const tasks = await electronApi.getTasks()
      set({ tasks })
    } finally {
      set({ loading: false })
    }
  },
  openTaskDetail: async (taskId: string) => {
    set({ detailLoading: true, selectedTask: undefined })
    try {
      const selectedTask = await electronApi.getTaskDetail(taskId)
      set({ selectedTask })
    } finally {
      set({ detailLoading: false })
    }
  },
  closeTaskDetail: () => set({ selectedTask: undefined, detailLoading: false })
}))
