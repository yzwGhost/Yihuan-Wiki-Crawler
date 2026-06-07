import { useEffect, useMemo } from 'react'
import { App as AntdApp, Button, Card, Col, Empty, Input, Row, Segmented, Space, Statistic, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { electronApi } from '@renderer/api/electronApi'
import { CharacterDetailDrawer } from '@renderer/components/CharacterDetailDrawer'
import { FailedImageList } from '@renderer/components/FailedImageList'
import { ImageGalleryCard } from '@renderer/components/ImageGalleryCard'
import { useCharacterStore } from '@renderer/stores/characterStore'
import { useImageStore, type ImageStatusFilter } from '@renderer/stores/imageStore'

const { Paragraph, Text } = Typography

export function ImageManager(): JSX.Element {
  const { message } = AntdApp.useApp()
  const summaries = useImageStore((state) => state.summaries)
  const detailsByName = useImageStore((state) => state.detailsByName)
  const detailLoadingByName = useImageStore((state) => state.detailLoadingByName)
  const loading = useImageStore((state) => state.loading)
  const keyword = useImageStore((state) => state.keyword)
  const statusFilter = useImageStore((state) => state.statusFilter)
  const loadSummaries = useImageStore((state) => state.loadSummaries)
  const ensureDetail = useImageStore((state) => state.ensureDetail)
  const setKeyword = useImageStore((state) => state.setKeyword)
  const setStatusFilter = useImageStore((state) => state.setStatusFilter)

  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter)
  const detailLoading = useCharacterStore((state) => state.detailLoading)
  const openCharacterDetail = useCharacterStore((state) => state.openCharacterDetail)
  const closeCharacterDetail = useCharacterStore((state) => state.closeCharacterDetail)

  useEffect(() => {
    void handleRefresh()
  }, [])

  const filteredSummaries = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return summaries.filter((summary) => {
      const matchesKeyword =
        !normalizedKeyword ||
        summary.name.toLowerCase().includes(normalizedKeyword) ||
        summary.url.toLowerCase().includes(normalizedKeyword)

      if (!matchesKeyword) {
        return false
      }

      if (statusFilter === 'downloaded') {
        return summary.imageCount > 0
      }

      if (statusFilter === 'failed') {
        return summary.downloadFailedCount > 0
      }

      return summary.imageCount > 0 || summary.downloadFailedCount > 0
    })
  }, [keyword, statusFilter, summaries])

  const failureSummaries = useMemo(
    () => filteredSummaries.filter((summary) => summary.downloadFailedCount > 0),
    [filteredSummaries]
  )

  const metrics = useMemo(() => {
    const charactersWithImages = summaries.filter((summary) => summary.imageCount > 0).length
    const downloadedImageCount = summaries.reduce((total, summary) => total + summary.imageCount, 0)
    const failedImageCount = summaries.reduce((total, summary) => total + summary.downloadFailedCount, 0)
    const charactersWithFailures = summaries.filter((summary) => summary.downloadFailedCount > 0).length

    return {
      charactersWithImages,
      downloadedImageCount,
      failedImageCount,
      charactersWithFailures
    }
  }, [summaries])

  const handleRefresh = async (): Promise<void> => {
    try {
      await loadSummaries()
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加载图片资源失败。')
    }
  }

  const handleEnsureDetail = async (name: string): Promise<void> => {
    try {
      await ensureDetail(name)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加载角色图片详情失败。')
    }
  }

  const handleOpenDetail = async (name: string): Promise<void> => {
    try {
      await openCharacterDetail(name)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '加载角色详情失败。')
    }
  }

  const handleOpenPath = async (targetPath: string): Promise<void> => {
    try {
      await electronApi.openPath(targetPath)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '打开路径失败。')
    }
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-intro">
        <Paragraph>
          集中浏览本地已下载的角色图片，并快速排查失败记录。页面默认只读取角色摘要，图片预览会在你需要时按角色加载。
        </Paragraph>
        <Space wrap>
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索角色名或 URL"
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
          />
          <Segmented<ImageStatusFilter>
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: '全部', value: 'all' },
              { label: '有已下载图片', value: 'downloaded' },
              { label: '有失败记录', value: 'failed' }
            ]}
          />
          <Button onClick={() => void handleRefresh()} loading={loading}>
            刷新图片数据
          </Button>
          <Text type="secondary">
            共 {summaries.length} 个角色，当前显示 {filteredSummaries.length} 个
          </Text>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="content-card stat-card">
            <Statistic title="有图片的角色" value={metrics.charactersWithImages} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="content-card stat-card">
            <Statistic title="已下载图片总数" value={metrics.downloadedImageCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="content-card stat-card">
            <Statistic title="失败图片总数" value={metrics.failedImageCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="content-card stat-card">
            <Statistic title="有失败记录的角色" value={metrics.charactersWithFailures} />
          </Card>
        </Col>
      </Row>

      <Card title="角色图片浏览" className="content-card">
        {filteredSummaries.length > 0 ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            {filteredSummaries.map((summary) => (
              <ImageGalleryCard
                key={summary.jsonFileName}
                summary={summary}
                detail={detailsByName[summary.name]}
                loading={Boolean(detailLoadingByName[summary.name])}
                onLoadPreview={() => handleEnsureDetail(summary.name)}
                onOpenImageDir={handleOpenPath}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </Space>
        ) : (
          <Empty description="当前筛选条件下没有可展示的图片资源" />
        )}
      </Card>

      <FailedImageList
        summaries={failureSummaries}
        detailsByName={detailsByName}
        loadingByName={detailLoadingByName}
        onLoadDetail={handleEnsureDetail}
        onOpenImageDir={handleOpenPath}
        onOpenDetail={handleOpenDetail}
      />

      <CharacterDetailDrawer
        detail={selectedCharacter}
        open={Boolean(selectedCharacter) || detailLoading}
        loading={detailLoading}
        onClose={closeCharacterDetail}
        onOpenJson={handleOpenPath}
        onOpenImageDir={handleOpenPath}
      />
    </Space>
  )
}
