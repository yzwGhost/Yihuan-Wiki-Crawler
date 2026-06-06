import { Typography } from 'antd'
import { useCrawlerStore } from '@renderer/stores/crawlerStore'

const { Text } = Typography

function levelClass(level: string): string {
  if (level === 'error' || level === 'stderr') {
    return 'log-line is-error'
  }

  if (level === 'done') {
    return 'log-line is-done'
  }

  if (level === 'progress') {
    return 'log-line is-progress'
  }

  return 'log-line'
}

export function LogPanel(): JSX.Element {
  const logs = useCrawlerStore((state) => state.logs)

  return (
    <div className="log-panel">
      {logs.length === 0 ? (
        <Text type="secondary">日志会在这里实时显示。</Text>
      ) : (
        logs.map((log) => (
          <div key={log.id} className={levelClass(log.level)}>
            <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span>{log.message}</span>
          </div>
        ))
      )}
    </div>
  )
}
