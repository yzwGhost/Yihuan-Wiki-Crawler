import { useEffect, useState } from 'react'
import {
  BorderOutlined,
  CloseOutlined,
  FullscreenExitOutlined,
  MinusOutlined
} from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import { electronApi } from '@renderer/api/electronApi'

const { Text } = Typography

interface WindowToolbarProps {
  pageTitle: string
}

export function WindowToolbar({ pageTitle }: WindowToolbarProps): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let active = true

    void electronApi.getWindowState().then((state) => {
      if (active) {
        setIsMaximized(state.isMaximized)
      }
    })

    const unsubscribe = electronApi.onWindowStateChange((state) => {
      setIsMaximized(state.isMaximized)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="window-toolbar">
      <div className="window-toolbar__drag">
        <Space size={10} className="window-toolbar__brand">
          <span className="window-toolbar__dot" aria-hidden="true" />
          <Text className="window-toolbar__title">Yihuan Guide Desk</Text>
          <Text className="window-toolbar__divider">/</Text>
          <Text className="window-toolbar__page">{pageTitle}</Text>
        </Space>
      </div>

      <div className="window-toolbar__actions">
        <Button
          type="text"
          className="window-toolbar__button"
          aria-label="Minimize window"
          onClick={() => void electronApi.minimizeWindow()}
          icon={<MinusOutlined />}
        />
        <Button
          type="text"
          className="window-toolbar__button"
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          onClick={() => void electronApi.toggleMaximizeWindow()}
          icon={isMaximized ? <FullscreenExitOutlined /> : <BorderOutlined />}
        />
        <Button
          type="text"
          danger
          className="window-toolbar__button window-toolbar__button--danger"
          aria-label="Close window"
          onClick={() => void electronApi.closeWindow()}
          icon={<CloseOutlined />}
        />
      </div>
    </div>
  )
}
