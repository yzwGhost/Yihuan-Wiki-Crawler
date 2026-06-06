import { useEffect } from 'react'
import { Button, Card, Empty, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { electronApi } from '@renderer/api/electronApi'
import { TaskDetailDrawer } from '@renderer/components/TaskDetailDrawer'
import { useTaskStore } from '@renderer/stores/taskStore'
import type { TaskSummary } from '@shared/task'

const { Paragraph, Text } = Typography

function statusColor(status: TaskSummary['status']): string {
  switch (status) {
    case 'completed':
      return 'green'
    case 'failed':
      return 'red'
    case 'stopped':
      return 'orange'
    default:
      return 'blue'
  }
}

function statusLabel(status: TaskSummary['status']): string {
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

function modeLabel(mode: TaskSummary['mode']): string {
  return mode === 'all' ? '全部角色' : '单角色'
}

export function TaskHistory(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks)
  const loading = useTaskStore((state) => state.loading)
  const detailLoading = useTaskStore((state) => state.detailLoading)
  const selectedTask = useTaskStore((state) => state.selectedTask)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const openTaskDetail = useTaskStore((state) => state.openTaskDetail)
  const closeTaskDetail = useTaskStore((state) => state.closeTaskDetail)

  useEffect(() => {
    void handleRefresh()
  }, [])

  const handleRefresh = async (): Promise<void> => {
    try {
      await loadTasks()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加载任务历史失败。')
    }
  }

  const handleOpenDetail = async (taskId: string): Promise<void> => {
    try {
      await openTaskDetail(taskId)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加载任务详情失败。')
    }
  }

  const handleAction = async (action: () => Promise<void>, successText: string): Promise<void> => {
    try {
      await action()
      void message.success(successText)
      await loadTasks()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '操作失败。')
    }
  }

  const columns: ColumnsType<TaskSummary> = [
    {
      title: '任务 ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 220,
      render: (value: string) => <Text code>{value}</Text>
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 110,
      render: (value: TaskSummary['mode']) => modeLabel(value)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: TaskSummary['status']) => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
      width: 90
    },
    {
      title: '成功数',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 110
    },
    {
      title: '失败数',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 110
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '结束时间',
      dataIndex: 'finished_at',
      key: 'finished_at',
      width: 180,
      render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '未结束')
    },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      render: (_value, record) => (
        <Space wrap>
          <Button size="small" type="primary" onClick={() => void handleOpenDetail(record.task_id)}>
            查看详情
          </Button>
          <Button
            size="small"
            disabled={record.mode !== 'all' || record.status === 'completed'}
            onClick={() => void handleAction(() => electronApi.resumeTask(record.task_id), '已开始继续任务。')}
          >
            继续任务
          </Button>
          <Button
            size="small"
            onClick={() => void handleAction(() => electronApi.retryFailedCharacters(record.task_id), '已开始重试失败角色。')}
          >
            重试失败角色
          </Button>
          <Button
            size="small"
            onClick={() => void handleAction(() => electronApi.retryFailedImages(record.task_id), '已开始重试失败图片。')}
          >
            重试失败图片
          </Button>
          <Button
            size="small"
            onClick={() =>
              void handleAction(async () => {
                const detail = await electronApi.getTaskDetail(record.task_id)
                if (!detail.log_path) {
                  throw new Error('当前任务没有日志文件。')
                }
                await electronApi.openPath(detail.log_path)
              }, '已打开任务日志。')
            }
          >
            打开任务日志
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-intro">
        <Paragraph>
          这里会显示本地 `data/tasks/tasks.json` 中记录的爬取任务，可查看详情、继续未完成任务，或重试失败角色与失败图片。
        </Paragraph>
        <Button onClick={() => void handleRefresh()} loading={loading}>
          刷新任务历史
        </Button>
      </div>

      <Card title="任务总表" className="content-card">
        <Table
          rowKey="task_id"
          loading={loading}
          dataSource={tasks}
          columns={columns}
          locale={{ emptyText: <Empty description="暂无任务历史" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <TaskDetailDrawer
        detail={selectedTask}
        open={Boolean(selectedTask) || detailLoading}
        loading={detailLoading}
        onClose={closeTaskDetail}
        onOpenLog={electronApi.openPath}
      />
    </Space>
  )
}
