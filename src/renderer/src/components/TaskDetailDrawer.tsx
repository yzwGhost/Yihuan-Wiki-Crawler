import { Descriptions, Drawer, Empty, List, Space, Tabs, Typography } from 'antd'
import type { TabsProps } from 'antd'
import type { TaskDetail } from '@shared/task'

const { Paragraph, Text } = Typography

interface TaskDetailDrawerProps {
  open: boolean
  loading: boolean
  detail?: TaskDetail
  onClose: () => void
  onOpenLog: (targetPath: string) => Promise<void>
}

function statusLabel(status: TaskDetail['status']): string {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'stopped':
      return '已停止'
    default:
      return '进行中'
  }
}

function modeLabel(mode: TaskDetail['mode']): string {
  return mode === 'all' ? '全部角色' : '单角色'
}

export function TaskDetailDrawer({
  open,
  loading,
  detail,
  onClose,
  onOpenLog
}: TaskDetailDrawerProps): JSX.Element {
  const items: TabsProps['items'] = [
    {
      key: 'summary',
      label: '基本信息',
      children: detail ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="任务 ID">{detail.task_id}</Descriptions.Item>
          <Descriptions.Item label="模式">{modeLabel(detail.mode)}</Descriptions.Item>
          <Descriptions.Item label="状态">{statusLabel(detail.status)}</Descriptions.Item>
          <Descriptions.Item label="总数">{detail.total}</Descriptions.Item>
          <Descriptions.Item label="成功数量">{detail.success_count}</Descriptions.Item>
          <Descriptions.Item label="失败数量">{detail.failed_count}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{detail.started_at}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{detail.finished_at || '未结束'}</Descriptions.Item>
          <Descriptions.Item label="任务日志">
            {detail.log_path ? (
              <a
                onClick={(event) => {
                  event.preventDefault()
                  void onOpenLog(detail.log_path)
                }}
              >
                打开任务日志
              </a>
            ) : (
              '无'
            )}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="暂无任务详情" />
      )
    },
    {
      key: 'success',
      label: '成功 URL',
      children: detail?.success_urls?.length ? (
        <List size="small" dataSource={detail.success_urls} renderItem={(item) => <List.Item>{item}</List.Item>} />
      ) : (
        <Empty description="暂无成功 URL" />
      )
    },
    {
      key: 'failed-urls',
      label: '失败 URL',
      children: detail?.failed_urls?.length ? (
        <List
          size="small"
          dataSource={detail.failed_urls}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text strong>{item.url}</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {item.error}
                </Paragraph>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无失败 URL" />
      )
    },
    {
      key: 'failed-images',
      label: '失败图片',
      children: detail?.failed_images?.length ? (
        <List
          size="small"
          dataSource={detail.failed_images}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Text strong>{item.character_name}</Text>
                <Text>{item.url}</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {item.error}
                </Paragraph>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无失败图片" />
      )
    },
    {
      key: 'json',
      label: '原始 JSON',
      children: detail ? <pre className="json-viewer">{detail.rawJson}</pre> : <Empty description="暂无原始 JSON" />
    }
  ]

  return (
    <Drawer title="任务详情" width={860} open={open} onClose={onClose} destroyOnClose={false}>
      {loading ? <Paragraph>加载任务详情中...</Paragraph> : <Tabs items={items} />}
    </Drawer>
  )
}
