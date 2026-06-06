import { useEffect } from 'react'
import { Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch, Typography, message } from 'antd'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import type { AppSettings } from '@shared/settings'

const { Paragraph, Title } = Typography

function normalizeFormValues(values: AppSettings): AppSettings {
  return {
    ...values,
    maxClick: Number(values.maxClick),
    pageWaitMs: Number(values.pageWaitMs),
    clickWaitMs: Number(values.clickWaitMs)
  }
}

export function Settings(): JSX.Element {
  const [form] = Form.useForm<AppSettings>()
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
      await saveSettings(values)
      void message.success('设置已保存')
    } catch (error) {
      if (error instanceof Error) {
        void message.error(error.message)
      }
    }
  }

  const handleReset = async (): Promise<void> => {
    try {
      const reset = await resetSettings()
      form.setFieldsValue(reset)
      void message.success('设置已恢复默认值')
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '重置设置失败')
    }
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-card page-card-compact">
        <Title level={2}>设置</Title>
        <Paragraph>统一管理 Python 路径、输出目录、导出目录，以及爬取过程的默认参数。</Paragraph>
      </div>

      <Card title="全局默认设置" className="content-card" loading={loading}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} xl={12}>
              <Form.Item label="Python 路径" name="pythonPath" rules={[{ required: true, message: '请输入 Python 路径' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} xl={12}>
              <Form.Item label="输出目录" name="outputDir" rules={[{ required: true, message: '请输入输出目录' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="导出目录" name="exportDir" rules={[{ required: true, message: '请输入导出目录' }]}>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="是否下载图片" name="downloadImages" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="是否无头模式" name="headless" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="是否启用断点续爬" name="resume" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="是否显示详细日志" name="verboseLogs" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="最大点击次数" name="maxClick">
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="页面等待时间(ms)" name="pageWaitMs">
                <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="点击等待时间(ms)" name="clickWaitMs">
                <InputNumber min={100} max={20000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" loading={saving} onClick={() => void handleSave()}>
              保存设置
            </Button>
            <Button loading={saving} onClick={() => void handleReset()}>
              恢复默认设置
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  )
}
