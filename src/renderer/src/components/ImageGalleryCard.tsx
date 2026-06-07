import { Button, Card, Empty, Image, Space, Tag, Typography } from 'antd'
import type { CharacterDetail, CharacterSummary } from '@shared/character'

const { Paragraph, Text } = Typography

interface ImageGalleryCardProps {
  summary: CharacterSummary
  detail?: CharacterDetail
  loading: boolean
  onLoadPreview: () => Promise<void>
  onOpenImageDir: (path: string) => Promise<void>
  onOpenDetail: (name: string) => Promise<void>
}

export function ImageGalleryCard(props: ImageGalleryCardProps): JSX.Element {
  const { summary, detail, loading, onLoadPreview, onOpenImageDir, onOpenDetail } = props
  const downloadedImages = detail?.images.downloaded ?? []
  const previewImages = downloadedImages.slice(0, 8)

  return (
    <Card
      className="content-card image-group-card"
      title={
        <Space wrap>
          <Text strong>{summary.name}</Text>
          <Tag>{summary.imageCount} 张图片</Tag>
          {summary.downloadFailedCount > 0 ? <Tag color="error">{summary.downloadFailedCount} 条失败</Tag> : null}
        </Space>
      }
      extra={
        <Space wrap>
          <Button size="small" onClick={() => void onOpenDetail(summary.name)}>
            查看角色详情
          </Button>
          <Button size="small" onClick={() => void onOpenImageDir(summary.imageDir)}>
            打开图片目录
          </Button>
        </Space>
      }
    >
      <Paragraph className="image-group-url">
        <Text type="secondary" ellipsis={{ tooltip: summary.url }}>
          {summary.url}
        </Text>
      </Paragraph>

      {!detail ? (
        <div className="image-group-empty">
          <Paragraph type="secondary">
            预览图片会按需加载，避免一次读取全部本地图片。
          </Paragraph>
          <Button type="primary" loading={loading} onClick={() => void onLoadPreview()}>
            加载图片预览
          </Button>
        </div>
      ) : previewImages.length > 0 ? (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Image.PreviewGroup>
            <div className="character-image-grid">
              {previewImages.map((image, index) => (
                <div key={`${image.url}-${index}`} className="character-image-card">
                  <Image
                    src={image.preview_src || image.file_url}
                    alt={`${summary.name}-${index + 1}`}
                    className="character-image"
                  />
                  <Text className="character-image-path" ellipsis={{ tooltip: image.local_path }}>
                    {image.local_path}
                  </Text>
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
          {downloadedImages.length > previewImages.length ? (
            <Text type="secondary">已显示前 {previewImages.length} 张，共 {downloadedImages.length} 张图片。</Text>
          ) : null}
        </Space>
      ) : (
        <Empty description="该角色暂无本地图片预览" />
      )}
    </Card>
  )
}
