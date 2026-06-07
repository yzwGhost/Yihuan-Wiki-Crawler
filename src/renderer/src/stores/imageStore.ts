import { create } from 'zustand'
import { electronApi } from '@renderer/api/electronApi'
import type { CharacterDetail, CharacterSummary } from '@shared/character'

export type ImageStatusFilter = 'all' | 'downloaded' | 'failed'

interface ImageStoreState {
  summaries: CharacterSummary[]
  detailsByName: Record<string, CharacterDetail>
  detailLoadingByName: Record<string, boolean>
  loading: boolean
  keyword: string
  statusFilter: ImageStatusFilter
  loadSummaries: () => Promise<void>
  ensureDetail: (name: string) => Promise<CharacterDetail>
  setKeyword: (keyword: string) => void
  setStatusFilter: (filter: ImageStatusFilter) => void
}

export const useImageStore = create<ImageStoreState>((set, get) => ({
  summaries: [],
  detailsByName: {},
  detailLoadingByName: {},
  loading: false,
  keyword: '',
  statusFilter: 'all',
  loadSummaries: async () => {
    set({ loading: true })
    try {
      const summaries = await electronApi.getCharacters()
      set({ summaries })
    } finally {
      set({ loading: false })
    }
  },
  ensureDetail: async (name) => {
    const cached = get().detailsByName[name]
    if (cached) {
      return cached
    }

    set((state) => ({
      detailLoadingByName: {
        ...state.detailLoadingByName,
        [name]: true
      }
    }))

    try {
      const detail = await electronApi.getCharacterDetail(name)
      set((state) => ({
        detailsByName: {
          ...state.detailsByName,
          [name]: detail
        },
        detailLoadingByName: {
          ...state.detailLoadingByName,
          [name]: false
        }
      }))
      return detail
    } catch (error) {
      set((state) => ({
        detailLoadingByName: {
          ...state.detailLoadingByName,
          [name]: false
        }
      }))
      throw error
    }
  },
  setKeyword: (keyword) => set({ keyword }),
  setStatusFilter: (statusFilter) => set({ statusFilter })
}))
