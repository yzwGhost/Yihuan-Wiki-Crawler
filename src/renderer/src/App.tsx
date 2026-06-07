import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
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
      <AntdApp>
        <AppLayout />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
