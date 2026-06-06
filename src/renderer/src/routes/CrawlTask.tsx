import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message
} from 'antd'
import { electronApi } from '@renderer/api/electronApi'
import { LogPanel } from '@renderer/components/LogPanel'
import { useCharacterStore } from '@renderer/stores/characterStore'
import { useCrawlerStore } from '@renderer/stores/crawlerStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import type { CrawlerStartOptions } from '@shared/crawler'

const { Paragraph, Text, Title } = Typography

interface CrawlTaskFormValues extends CrawlerStartOptions {}

function toCrawlerDefaults(settings: ReturnType<typeof useSettingsStore.getState>['settings']): CrawlTaskFormValues {
  return {
    mode: 'single',
    url: 'https://www.gamekee.com/yh/669570.html',
    outputDir: settings.outputDir,
    downloadImages: settings.downloadImages,
    headless: settings.headless,
    maxClick: settings.maxClick,
    pageWait: settings.pageWaitMs,
    clickWait: settings.clickWaitMs,
    resume: settings.resume
  }
}

export function CrawlTask(): JSX.Element {
  const [form] = Form.useForm<CrawlTaskFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const running = useCrawlerStore((state) => state.running)
  const current = useCrawlerStore((state) => state.current)
  const total = useCrawlerStore((state) => state.total)
  const currentMessage = useCrawlerStore((state) => state.currentMessage)
  const successCount = useCrawlerStore((state) => state.successCount)
  const failedCount = useCrawlerStore((state) => state.failedCount)
  const setRunning = useCrawlerStore((state) => state.setRunning)
  const setMode = useCrawlerStore((state) => state.setMode)
  const appendLog = useCrawlerStore((state) => state.appendLog)
  const setProgress = useCrawlerStore((state) => state.setProgress)
  const setResult = useCrawlerStore((state) => state.setResult)
  const incrementSuccess = useCrawlerStore((state) => state.incrementSuccess)
  const incrementFailed = useCrawlerStore((state) => state.incrementFailed)
  const resetLogs = useCrawlerStore((state) => state.resetLogs)
  const loadCharacters = useCharacterStore((state) => state.loadCharacters)
  const settings = useSettingsStore((state) => state.settings)
  const saveSettings = useSettingsStore((state) => state.saveSettings)

  const mode = Form.useWatch('mode', form) ?? 'single'
  const progressPercent = useMemo(() => {
    if (total <= 0) {
      return 0
    }

    return Math.min(100, Math.round((current / total) * 100))
  }, [current, total])

  useEffect(() => {
    form.setFieldsValue(toCrawlerDefaults(settings))
  }, [form, settings])

  useEffect(() => {
    const unsubscribeMessage = electronApi.onCrawlerMessage((payload) => {
      const shouldAppendLog = settings.verboseLogs || payload.type !== 'log'

      if (shouldAppendLog) {
        appendLog({
          id: `${payload.timestamp}-${Math.random().toString(16).slice(2)}`,
          level: payload.type,
          message: payload.message,
          timestamp: payload.timestamp
        })
      }

      if (payload.type === 'progress') {
        setProgress(payload.current ?? 0, payload.total ?? 0, payload.message)
      }

      if (payload.eventType === 'character_done') {
        incrementSuccess()
      }

      if (payload.eventType === 'character_failed') {
        incrementFailed()
      }

      if (payload.type === 'error') {
        void message.error(payload.message)
      }
    })

    const unsubscribeDone = electronApi.onCrawlerDone((payload) => {
      setRunning(false)
      setStopping(false)
      setResult(payload.success, payload.failed)
      void loadCharacters().catch(() => undefined)
      appendLog({
        id: `${payload.timestamp}-done`,
        level: 'done',
        message: `任务完成，成功 ${payload.success}，失败 ${payload.failed}。`,
        timestamp: payload.timestamp
      })
      void message.success('任务完成，可前往角色资料页查看或刷新。')
    })

    const unsubscribeError = electronApi.onCrawlerError((payload) => {
      setRunning(false)
      setStopping(false)
      appendLog({
        id: `${payload.timestamp}-error`,
        level: 'error',
        message: payload.message,
        timestamp: payload.timestamp
      })
      void message.error(payload.message)
    })

    return () => {
      unsubscribeMessage()
      unsubscribeDone()
      unsubscribeError()
    }
  }, [
    appendLog,
    incrementFailed,
    incrementSuccess,
    loadCharacters,
    setProgress,
    setResult,
    setRunning,
    settings.verboseLogs
  ])

  const handleStart = async (): Promise<void> => {
    const values = await form.validateFields()
    const startOptions: CrawlerStartOptions = {
      ...values,
      url: values.mode === 'single' ? values.url?.trim() : undefined,
      resume: values.mode === 'all' ? values.resume : false
    }
    setSubmitting(true)

    try {
      resetLogs()
      setMode(startOptions.mode)
      setRunning(true)
      setResult(0, 0)
      await electronApi.startCrawler(startOptions)
      appendLog({
        id: `${Date.now()}-start`,
        level: 'log',
        message: '已启动 Python 爬虫进程。',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setRunning(false)
      const errorMessage = error instanceof Error ? error.message : '启动失败'
      appendLog({
        id: `${Date.now()}-start-error`,
        level: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      })
      void message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStop = async (): Promise<void> => {
    setStopping(true)

    try {
      await electronApi.stopCrawler()
      setRunning(false)
      appendLog({
        id: `${Date.now()}-stop`,
        level: 'log',
        message: '已请求停止 Python 子进程。',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '停止失败'
      appendLog({
        id: `${Date.now()}-stop-error`,
        level: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      })
      void message.error(errorMessage)
    } finally {
      setStopping(false)
    }
  }

  const handleSaveDefaults = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      await saveSettings({
        ...settings,
        outputDir: values.outputDir,
        downloadImages: values.downloadImages,
        headless: values.headless,
        maxClick: values.maxClick,
        pageWaitMs: values.pageWait,
        clickWaitMs: values.clickWait,
        resume: Boolean(values.resume)
      })
      void message.success('当前参数已保存为默认设置')
    } catch (error) {
      if (error instanceof Error) {
        void message.error(error.message)
      }
    }
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-card page-card-compact">
        <Title level={2}>爬取任务</Title>
        <Paragraph>这里可以启动单角色或全部角色的真实爬取，并实时查看 Python 输出的日志与进度。</Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={12}>
          <Card title="任务参数" className="content-card">
            <Form form={form} layout="vertical">
              <Form.Item label="爬取模式" name="mode">
                <Select
                  options={[
                    { label: '单角色', value: 'single' },
                    { label: '全部角色', value: 'all' }
                  ]}
                />
              </Form.Item>

              {mode === 'single' ? (
                <Form.Item label="角色 URL" name="url" rules={[{ required: true, message: '单角色模式下请输入 URL' }]}>
                  <Input placeholder="https://www.gamekee.com/yh/669570.html" />
                </Form.Item>
              ) : null}

              <Form.Item label="输出目录" name="outputDir">
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="下载图片" name="downloadImages" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="无头模式" name="headless" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="断点续爬"
                name="resume"
                valuePropName="checked"
                extra="仅在“全部角色”模式下生效，会优先继续最近的未完成任务。"
              >
                <Switch disabled={mode !== 'all'} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="最大点击数" name="maxClick">
                    <InputNumber min={1} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="页面等待(ms)" name="pageWait">
                    <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="点击等待(ms)" name="clickWait">
                    <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Space wrap>
                <Button type="primary" onClick={() => void handleStart()} loading={submitting} disabled={running}>
                  开始
                </Button>
                <Button danger onClick={() => void handleStop()} loading={stopping} disabled={!running}>
                  停止
                </Button>
                <Button onClick={() => void handleSaveDefaults()} disabled={running}>
                  保存为默认设置
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="任务状态" className="content-card">
            <Space direction="vertical" size={16} style={{ display: 'flex' }}>
              <Alert
                type="info"
                message={running ? 'Python 子进程运行中' : '当前没有运行中的爬虫任务'}
                description={currentMessage || '点击开始后，这里会显示当前处理的角色或链接。'}
                showIcon
              />
              <Progress percent={progressPercent} status={running ? 'active' : 'normal'} />
              <Space size="large" wrap>
                <Text>
                  进度：{current}/{total || '?'}
                </Text>
                <Text>成功：{successCount}</Text>
                <Text>失败：{failedCount}</Text>
              </Space>
              {currentMessage ? <Text type="secondary">当前：{currentMessage}</Text> : null}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="实时日志" className="content-card">
        <LogPanel />
      </Card>
    </Space>
  )
}
