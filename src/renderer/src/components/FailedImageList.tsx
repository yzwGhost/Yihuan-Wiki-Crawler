import { Button, Card, Collapse, Empty, List, Space, Tag, Typography } from 'antd'
import type { CharacterDetail, CharacterSummary } from '@shared/character'

const { Paragraph, Text } = Typography

interface FailedImageListProps {
  summaries: CharacterSummary[]
  detailsByName: Record<string, CharacterDetail>
  loadingByName: Record<string, boolean>
  onLoadDetail: (name: string) => Promise<void>
  onOpenImageDir: (path: string) => Promise<void>
  onOpenDetail: (name: string) => Promise<void>
}

export function FailedImageList(props: FailedImageListProps): JSX.Element {
  const { summaries, detailsByName, loadingByName, onLoadDetail, onOpenImageDir, onOpenDetail } = props

  if (summaries.length === 0) {
    return (
      <Card title="失败图片记录" className="content-card">
        <Empty description="当前筛选条件下没有失败图片记录" />
      </Card>
    )
  }

  return (
    <Card title="失败图片记录" className="content-card">
      <Collapse
        items={summaries.map((summary) => {
          const detail = detailsByName[summary.name]
          const failedImages = detail?.images.download_failed ?? []

          return {
            key: summary.name,
            label: (
              <Space wrap>
                <Text strong>{summary.name}</Text>
                <Tag color="error">{summary.downloadFailedCount} 条失败</Tag>
              </Space>
            ),
            extra: (
              <Space wrap>
                <Button
                  size="small"
                  type="text"
                  loading={loadingByName[summary.name]}
                  onClick={(event) => {
                    event.stopPropagation()
                    void onLoadDetail(summary.name)
                  }}
                >
                  {detail ? '刷新记录' : '加载记录'}
                </Button>
                <Button
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    void onOpenDetail(summary.name)
                  }}
                >
                  查看角色详情
                </Button>
                <Button
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    void onOpenImageDir(summary.imageDir)
                  }}
                >
                  打开图片目录
                </Button>
              </Space>
            ),
            children: detail ? (
              failedImages.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={failedImages}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={6} style={{ display: 'flex' }}>
                        <Paragraph style={{ marginBottom: 0 }}>
                          <Text strong>图片 URL：</Text>
                          <Text copyable>{item.url}</Text>
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                          <Text strong>失败原因：</Text>
                          <Text type="secondary">{item.error}</Text>
                        </Paragraph>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="当前没有失败记录" />
              )
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                点击“加载记录”读取该角色的失败图片详情。
              </Paragraph>
            )
          }
        })}
      />
    </Card>
  )
}
