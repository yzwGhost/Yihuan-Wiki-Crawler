import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { useSettingsStore } from './stores/settingsStore'
import { guideTheme } from './theme/guideTheme'
import { AppLayout } from './components/AppLayout'

function App(): JSX.Element {
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  useEffect(() => {
    void loadSettings().catch(() => undefined)
  }, [loadSettings])

  return (
    <ConfigProvider theme={guideTheme}>
      <AppLayout />
    </ConfigProvider>
  )
}

export default App
