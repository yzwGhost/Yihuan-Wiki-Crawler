import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Input, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined } from '@ant-design/icons'
import { electronApi } from '@renderer/api/electronApi'
import { CharacterDetailDrawer } from '@renderer/components/CharacterDetailDrawer'
import { useCharacterStore } from '@renderer/stores/characterStore'
import type { CharacterSummary } from '@shared/character'

const { Paragraph, Text, Title } = Typography

const columns: ColumnsType<CharacterSummary> = [
  {
    title: '角色名',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    render: (value: string) => <Text strong>{value}</Text>
  },
  {
    title: 'URL',
    dataIndex: 'url',
    key: 'url',
    ellipsis: true,
    render: (value: string) => <Text ellipsis={{ tooltip: value }}>{value}</Text>
  },
  {
    title: '默认章节数量',
    dataIndex: 'defaultSectionCount',
    key: 'defaultSectionCount',
    width: 120
  },
  {
    title: '交互章节数量',
    dataIndex: 'interactiveSectionCount',
    key: 'interactiveSectionCount',
    width: 120
  },
  {
    title: '图片数量',
    dataIndex: 'imageCount',
    key: 'imageCount',
    width: 100
  },
  {
    title: '下载失败数量',
    dataIndex: 'downloadFailedCount',
    key: 'downloadFailedCount',
    width: 120
  }
]

export function CharacterList(): JSX.Element {
  const [keyword, setKeyword] = useState('')

  const characters = useCharacterStore((state) => state.characters)
  const loading = useCharacterStore((state) => state.loading)
  const detailLoading = useCharacterStore((state) => state.detailLoading)
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter)
  const loadCharacters = useCharacterStore((state) => state.loadCharacters)
  const openCharacterDetail = useCharacterStore((state) => state.openCharacterDetail)
  const closeCharacterDetail = useCharacterStore((state) => state.closeCharacterDetail)

  useEffect(() => {
    void handleRefresh()
  }, [])

  const filteredCharacters = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return characters
    }

    return characters.filter((character) => {
      const name = character.name.toLowerCase()
      const url = character.url.toLowerCase()
      return name.includes(normalizedKeyword) || url.includes(normalizedKeyword)
    })
  }, [characters, keyword])

  const handleRefresh = async (): Promise<void> => {
    try {
      await loadCharacters()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载角色列表失败'
      void message.error(errorMessage)
    }
  }

  const handleOpenDetail = async (name: string): Promise<void> => {
    try {
      await openCharacterDetail(name)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载角色详情失败'
      void message.error(errorMessage)
    }
  }

  const handleOpenPath = async (targetPath: string): Promise<void> => {
    try {
      await electronApi.openPath(targetPath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '打开路径失败'
      void message.error(errorMessage)
    }
  }

  const actionColumn: ColumnsType<CharacterSummary>[number] = {
    title: '操作',
    key: 'actions',
    width: 260,
    render: (_value, record) => (
      <Space wrap>
        <Button size="small" type="primary" onClick={() => void handleOpenDetail(record.name)}>
          查看详情
        </Button>
        <Button size="small" onClick={() => void handleOpenPath(record.jsonPath)}>
          打开 JSON 文件
        </Button>
        <Button size="small" onClick={() => void handleOpenPath(record.imageDir)}>
          打开图片目录
        </Button>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-card page-card-compact">
        <Title level={2}>角色档案</Title>
        <Paragraph>
          本页会扫描本地 `data/characters` 目录，整理出每个角色的章节、图片和失败记录，方便像浏览攻略站图鉴一样查看数据。
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
          <Button onClick={() => void handleRefresh()} loading={loading}>
            刷新档案列表
          </Button>
          <Text type="secondary">
            共 {characters.length} 条，当前显示 {filteredCharacters.length} 条
          </Text>
        </Space>
      </div>

      <Card title="角色档案总表" className="content-card">
        <Table
          rowKey="jsonFileName"
          loading={loading}
          dataSource={filteredCharacters}
          columns={[...columns, actionColumn]}
          locale={{
            emptyText: (
              <Empty description={keyword.trim() ? '没有匹配的角色数据' : '暂无角色数据'} />
            )
          }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1100 }}
        />
      </Card>

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
