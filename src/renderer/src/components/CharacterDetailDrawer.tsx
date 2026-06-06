import { Button, Collapse, Drawer, Empty, Image, List, Space, Tabs, Typography } from 'antd'
import type { CharacterDetail } from '@shared/character'

const { Paragraph, Text } = Typography

interface CharacterDetailDrawerProps {
  detail?: CharacterDetail
  open: boolean
  loading: boolean
  onClose: () => void
  onOpenJson: (path: string) => Promise<void>
  onOpenImageDir: (path: string) => Promise<void>
}

function renderSections(
  sections: Array<{ title: string; lines: string[]; button_text?: string }>
): JSX.Element {
  if (sections.length === 0) {
    return <Empty description="暂无内容" />
  }

  return (
    <Collapse
      items={sections.map((section, index) => ({
        key: `${section.title}-${index}`,
        label: section.button_text ? `${section.title} · ${section.button_text}` : section.title,
        children: (
          <List
            size="small"
            dataSource={section.lines}
            locale={{ emptyText: '暂无条目' }}
            renderItem={(line) => <List.Item>{line}</List.Item>}
          />
        )
      }))}
    />
  )
}

export function CharacterDetailDrawer(props: CharacterDetailDrawerProps): JSX.Element {
  const { detail, open, loading, onClose, onOpenJson, onOpenImageDir } = props

  return (
    <Drawer
      title={detail ? `角色详情 · ${detail.name}` : '角色详情'}
      placement="right"
      width={920}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        detail ? (
          <Space>
            <Button onClick={() => void onOpenJson(detail.jsonPath)}>打开 JSON 文件</Button>
            <Button onClick={() => void onOpenImageDir(detail.imageDir)}>打开图片目录</Button>
          </Space>
        ) : null
      }
    >
      {detail ? (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>页面 URL：</Text>
              <Text copyable>{detail.url}</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>JSON 路径：</Text>
              <Text copyable>{detail.jsonPath}</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <Text strong>图片目录：</Text>
              <Text copyable>{detail.imageDir}</Text>
            </Paragraph>
          </div>
          <Tabs
            items={[
              {
                key: 'default',
                label: `默认章节 (${detail.default_sections.length})`,
                children: renderSections(detail.default_sections)
              },
              {
                key: 'interactive',
                label: `交互章节 (${detail.interactive_sections.length})`,
                children: renderSections(detail.interactive_sections)
              },
              {
                key: 'images',
                label: `图片 (${detail.images.downloaded.length})`,
                children:
                  detail.images.downloaded.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="character-image-grid">
                        {detail.images.downloaded.map((image, index) => (
                          <div key={`${image.url}-${index}`} className="character-image-card">
                            <Image
                              src={image.preview_src || image.file_url}
                              alt={`${detail.name}-${index + 1}`}
                              className="character-image"
                            />
                            <Text className="character-image-path" ellipsis={{ tooltip: image.local_path }}>
                              {image.local_path}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <Empty description="暂无本地图片" />
                  )
              },
              {
                key: 'json',
                label: '原始 JSON',
                children: <pre className="json-viewer">{detail.rawJson}</pre>
              }
            ]}
          />
        </Space>
      ) : loading ? (
        <Paragraph>正在加载角色详情...</Paragraph>
      ) : (
        <Empty description="请选择一个角色查看详情" />
      )}
    </Drawer>
  )
}
