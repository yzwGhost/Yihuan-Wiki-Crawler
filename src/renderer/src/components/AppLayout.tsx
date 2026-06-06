import { useMemo, useState } from 'react'
import {
  AppstoreOutlined,
  DashboardOutlined,
  ExportOutlined,
  FileImageOutlined,
  HistoryOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { electronApi } from '@renderer/api/electronApi'
import { CharacterList } from '@renderer/routes/CharacterList'
import { CrawlTask } from '@renderer/routes/CrawlTask'
import { ExportData } from '@renderer/routes/ExportData'
import { PlaceholderPage } from '@renderer/routes/PlaceholderPage'
import { Settings } from '@renderer/routes/Settings'
import { TaskHistory } from '@renderer/routes/TaskHistory'
import { useAppStore, type PageKey } from '@renderer/store/appStore'

const { Header, Sider, Content } = Layout
const { Paragraph, Text, Title } = Typography

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '总览' },
  { key: 'tasks', icon: <AppstoreOutlined />, label: '爬取任务' },
  { key: 'taskHistory', icon: <HistoryOutlined />, label: '任务历史' },
  { key: 'profiles', icon: <TeamOutlined />, label: '角色资料' },
  { key: 'images', icon: <FileImageOutlined />, label: '图片资源' },
  { key: 'exports', icon: <ExportOutlined />, label: '数据导出' },
  { key: 'settings', icon: <SettingOutlined />, label: '设置' }
] satisfies Array<{ key: PageKey; icon: JSX.Element; label: string }>

const pageContent: Record<PageKey, { title: string; description: string }> = {
  dashboard: {
    title: '总览',
    description: '查看当前项目的整体进度、任务状态和最近沉淀的数据。'
  },
  tasks: {
    title: '爬取任务',
    description: '配置抓取参数，并实时查看 Python 爬虫输出的日志与进度。'
  },
  taskHistory: {
    title: '任务历史',
    description: '查看历史抓取记录，继续未完成任务，或重试失败角色与失败图片。'
  },
  profiles: {
    title: '角色资料',
    description: '浏览本地角色 JSON、章节内容与图片资源。'
  },
  images: {
    title: '图片资源',
    description: '集中查看下载后的角色图片与资源结构。'
  },
  exports: {
    title: '数据导出',
    description: '导出角色资料，供后续分析、归档或二次整理使用。'
  },
  settings: {
    title: '设置',
    description: '统一管理 Python、输出目录、导出目录和默认抓取参数。'
  }
}

export function AppLayout(): JSX.Element {
  const activePage = useAppStore((state) => state.activePage)
  const setActivePage = useAppStore((state) => state.setActivePage)
  const [pingResult, setPingResult] = useState('未测试')
  const [pingLoading, setPingLoading] = useState(false)

  const handlePing = async (): Promise<void> => {
    setPingLoading(true)
    try {
      const response = await electronApi.ping('hello from renderer')
      setPingResult(response)
    } catch (error) {
      setPingResult(error instanceof Error ? `IPC 调用失败：${error.message}` : 'IPC 调用失败')
    } finally {
      setPingLoading(false)
    }
  }

  const currentPage = pageContent[activePage]
  const pageNode = useMemo(() => {
    if (activePage === 'tasks') {
      return <CrawlTask />
    }
    if (activePage === 'profiles') {
      return <CharacterList />
    }
    if (activePage === 'taskHistory') {
      return <TaskHistory />
    }
    if (activePage === 'exports') {
      return <ExportData />
    }
    if (activePage === 'settings') {
      return <Settings />
    }
    return <PlaceholderPage title={currentPage.title} description={currentPage.description} />
  }, [activePage, currentPage.description, currentPage.title])

  return (
    <Layout className="app-shell">
      <Sider width={248} className="app-sider">
        <div className="brand-block">
          <Tag className="brand-badge">Yihuan Wiki Crawler</Tag>
          <Title level={3} className="brand-title">
            Yihuan Guide Desk
          </Title>
          <Paragraph className="brand-subtitle">
            简洁、直观、面向角色资料整理的桌面工作台。
          </Paragraph>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activePage]}
          items={menuItems}
          onClick={({ key }) => setActivePage(key as PageKey)}
        />
      </Sider>

      <Layout className="app-main">
        <Header className="app-header">
          <div className="header-copy">
            <Text className="header-kicker">攻略站控制台</Text>
            <Title level={3} className="header-title">
              {currentPage.title}
            </Title>
            <Text className="header-description">{currentPage.description}</Text>
          </div>
          <Space size="middle" className="header-status" wrap>
            <Tag className="status-tag">第七阶段</Tag>
            <Text>时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</Text>
            <Text>IPC：{pingResult}</Text>
            <Button type="primary" loading={pingLoading} onClick={() => void handlePing()}>
              测试连接
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <div className="page-scroll">{pageNode}</div>
        </Content>
      </Layout>
    </Layout>
  )
}
