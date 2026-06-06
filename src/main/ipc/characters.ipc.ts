import { ipcMain } from 'electron'
import { getCharacterDetail, listCharacters } from '@main/services/character.service'

export function registerCharactersIpc(): void {
  ipcMain.removeHandler('characters:list')
  ipcMain.removeHandler('characters:detail')

  ipcMain.handle('characters:list', async () => {
    return listCharacters()
  })

  ipcMain.handle('characters:detail', async (_event, name: string) => {
    return getCharacterDetail(name)
  })
}
