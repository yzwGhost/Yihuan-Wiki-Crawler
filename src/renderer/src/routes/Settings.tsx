import { useEffect, useState } from 'react'
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Switch,
  Typography
} from 'antd'
import { electronApi } from '@renderer/api/electronApi'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import type { EnvironmentCheckResult } from '@shared/environment'
import type { AppSettings } from '@shared/settings'

const { Paragraph, Text } = Typography

function normalizeFormValues(values: AppSettings): AppSettings {
  return {
    ...values,
    maxClick: Number(values.maxClick),
    pageWaitMs: Number(values.pageWaitMs),
    clickWaitMs: Number(values.clickWaitMs)
  }
}

export function Settings(): JSX.Element {
  const { modal, message } = AntdApp.useApp()
  const [form] = Form.useForm<AppSettings>()
  const [checkingEnv, setCheckingEnv] = useState(false)
  const [envResult, setEnvResult] = useState<EnvironmentCheckResult | null>(null)
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)
  const saving = useSettingsStore((state) => state.saving)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const saveSettings = useSettingsStore((state) => state.saveSettings)
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  useEffect(() => {
    void loadSettings().catch(() => undefined)
  }, [loadSettings])

  useEffect(() => {
    form.setFieldsValue(settings)
  }, [form, settings])

  const handleSave = async (): Promise<void> => {
    try {
      const values = normalizeFormValues(await form.validateFields())
      const saved = await saveSettings(values)
      form.setFieldsValue(saved)
      await modal.success({
        title: '设置已保存',
        content: '新的全局设置已写入 data/settings.json，后续任务会使用这些默认值。',
        okText: '知道了'
      })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'errorFields' in error) {
        await modal.warning({
          title: '请先完善设置项',
          content: '表单中还有未填写或格式不正确的字段，请修正后再保存。',
          okText: '继续修改'
        })
        return
      }

      await modal.error({
        title: '保存失败',
        content: error instanceof Error ? error.message : '保存设置时发生未知错误。',
        okText: '关闭'
      })
    }
  }

  const handleReset = (): void => {
    void modal.confirm({
      title: '恢复默认设置',
      content: '这会覆盖当前已保存的全局设置，并立即写入 data/settings.json。',
      okText: '恢复默认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const reset = await resetSettings()
          form.setFieldsValue(reset)
          await modal.success({
            title: '默认设置已恢复',
            content: '全局设置已经恢复为默认值。',
            okText: '知道了'
          })
        } catch (error) {
          await modal.error({
            title: '恢复失败',
            content: error instanceof Error ? error.message : '恢复默认设置失败。',
            okText: '关闭'
          })
        }
      }
    })
  }

  const handleEnvCheck = async (): Promise<void> => {
    setCheckingEnv(true)
    try {
      const result = await electronApi.checkEnvironment()
      setEnvResult(result)
      void message.success(result.checks.every((item) => item.ok) ? '环境检查通过。' : '环境检查已完成，请查看详情。')
    } catch (error) {
      setEnvResult(null)
      void message.error(error instanceof Error ? error.message : '环境检查失败。')
    } finally {
      setCheckingEnv(false)
    }
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-intro">
        <Paragraph>
          统一管理 Python 路径、输出目录、导出目录，以及爬取过程的默认参数。在“爬取任务”页临时修改参数时，不会自动覆盖这里的设置。
        </Paragraph>
      </div>

      <Card title="全局默认设置" className="content-card" loading={loading}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} xl={12}>
              <Form.Item label="Python 路径" name="pythonPath" rules={[{ required: true, message: '请输入 Python 路径。' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} xl={12}>
              <Form.Item label="输出目录" name="outputDir" rules={[{ required: true, message: '请输入输出目录。' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="导出目录" name="exportDir" rules={[{ required: true, message: '请输入导出目录。' }]}>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="默认下载图片" name="downloadImages" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="默认无头模式" name="headless" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="默认启用断点续爬" name="resume" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="显示详细日志" name="verboseLogs" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="最大点击次数" name="maxClick">
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="页面等待时间 (ms)" name="pageWaitMs">
                <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="点击等待时间 (ms)" name="clickWaitMs">
                <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Space wrap>
            <Button type="primary" loading={saving} onClick={() => void handleSave()}>
              保存设置
            </Button>
            <Button loading={saving} onClick={handleReset}>
              恢复默认设置
            </Button>
            <Button loading={checkingEnv} onClick={() => void handleEnvCheck()}>
              环境检查
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title="环境检查结果" className="content-card">
        {envResult ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert
              type={envResult.checks.every((item) => item.ok) ? 'success' : 'warning'}
              showIcon
              message={envResult.checks.every((item) => item.ok) ? '环境检查通过。' : '环境中存在需要处理的项目。'}
              description={envResult.playwrightMessage}
            />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="当前模式">{envResult.isPackaged ? '已打包应用' : '开发环境'}</Descriptions.Item>
              <Descriptions.Item label="爬虫可执行文件路径">
                <Text copyable>{envResult.crawlerExecutablePath}</Text>
              </Descriptions.Item>
              {envResult.crawlerScriptPath ? (
                <Descriptions.Item label="开发环境爬虫脚本">
                  <Text copyable>{envResult.crawlerScriptPath}</Text>
                </Descriptions.Item>
              ) : null}
              <Descriptions.Item label="数据目录">
                <Text copyable>{envResult.dataDir}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="输出目录">
                <Text copyable>{envResult.outputDir}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="设置文件">
                <Text copyable>{envResult.settingsPath}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small">
              {envResult.checks.map((check) => (
                <Descriptions.Item key={check.name} label={check.name}>
                  <Space direction="vertical" size={4}>
                    <Text>{check.ok ? '通过' : '失败'}</Text>
                    <Text type="secondary">{check.message}</Text>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Space>
        ) : (
          <Paragraph type="secondary">
            点击“环境检查”后，将显示爬虫可执行文件路径、数据目录、可写状态和 Playwright Chromium 状态。
          </Paragraph>
        )}
      </Card>
    </Space>
  )
}
