import { create } from 'zustand'
import { electronApi } from '@renderer/api/electronApi'
import type { CharacterDetail, CharacterSummary } from '@shared/character'

interface CharacterStoreState {
  characters: CharacterSummary[]
  loading: boolean
  detailLoading: boolean
  selectedCharacter?: CharacterDetail
  loadCharacters: () => Promise<void>
  openCharacterDetail: (name: string) => Promise<void>
  closeCharacterDetail: () => void
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  characters: [],
  loading: false,
  detailLoading: false,
  selectedCharacter: undefined,
  loadCharacters: async () => {
    set({ loading: true })
    try {
      const characters = await electronApi.getCharacters()
      set({ characters })
    } finally {
      set({ loading: false })
    }
  },
  openCharacterDetail: async (name: string) => {
    set({ detailLoading: true, selectedCharacter: undefined })
    try {
      const selectedCharacter = await electronApi.getCharacterDetail(name)
      set({ selectedCharacter })
    } finally {
      set({ detailLoading: false })
    }
  },
  closeCharacterDetail: () => set({ selectedCharacter: undefined, detailLoading: false })
}))
