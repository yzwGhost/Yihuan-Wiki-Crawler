import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from 'antd'
import { electronApi } from '@renderer/api/electronApi'
import { useCharacterStore } from '@renderer/stores/characterStore'
import { useSettingsStore } from '@renderer/stores/settingsStore'

const { Paragraph, Text, Title } = Typography

interface ExportFormValues {
  characterName?: string
}

export function ExportData(): JSX.Element {
  const [form] = Form.useForm<ExportFormValues>()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [lastExportPath, setLastExportPath] = useState<string>('')
  const characters = useCharacterStore((state) => state.characters)
  const loadCharacters = useCharacterStore((state) => state.loadCharacters)
  const settings = useSettingsStore((state) => state.settings)
  const saveSettings = useSettingsStore((state) => state.saveSettings)

  useEffect(() => {
    if (characters.length === 0) {
      void loadCharacters().catch(() => undefined)
    }
  }, [characters.length, loadCharacters])

  const characterOptions = useMemo(
    () => characters.map((item) => ({ label: item.name, value: item.name })),
    [characters]
  )

  const runExport = async (key: string, action: () => Promise<{ path: string }>, successText: string): Promise<void> => {
    setBusyKey(key)
    try {
      const result = await action()
      setLastExportPath(result.path)
      void message.success(successText)
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setBusyKey(null)
    }
  }

  const handleSelectExportDir = async (): Promise<void> => {
    try {
      const selectedPath = await electronApi.selectExportDir()
      if (!selectedPath) {
        return
      }
      await saveSettings({ ...settings, exportDir: selectedPath })
      setLastExportPath(selectedPath)
      void message.success('导出目录已更新')
    } catch (error) {
      void message.error(error instanceof Error ? error.message : '选择导出目录失败')
    }
  }

  const requireCharacter = async (): Promise<string> => {
    const values = await form.validateFields()
    if (!values.characterName) {
      throw new Error('请选择角色')
    }
    return values.characterName
  }

  return (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div className="page-card page-card-compact">
        <Title level={2}>数据导出</Title>
        <Paragraph>
          将已爬取的角色数据导出为 JSON、CSV 或 Markdown 文件。默认导出目录来自设置，可在这里直接切换并打开目录。
        </Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={12}>
          <Card title="导出目录" className="content-card">
            <Space direction="vertical" size={16} style={{ display: 'flex' }}>
              <div>
                <Text type="secondary">当前导出目录</Text>
                <Input value={settings.exportDir} readOnly />
              </div>
              <Space wrap>
                <Button onClick={() => void handleSelectExportDir()}>选择导出目录</Button>
                <Button onClick={() => void runExport('open-dir', electronApi.openExportDir, '已打开导出目录')}>
                  打开导出目录
                </Button>
              </Space>
              {lastExportPath ? <Text type="secondary">最近输出：{lastExportPath}</Text> : null}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="单角色导出" className="content-card">
            <Form form={form} layout="vertical">
              <Form.Item name="characterName" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select
                  showSearch
                  options={characterOptions}
                  placeholder="选择一个已爬取角色"
                  optionFilterProp="label"
                />
              </Form.Item>
              <Space wrap>
                <Button
                  type="primary"
                  loading={busyKey === 'single-json'}
                  onClick={() =>
                    void runExport(
                      'single-json',
                      async () => electronApi.exportSingleJson(await requireCharacter()),
                      '单角色 JSON 导出成功'
                    )
                  }
                >
                  导出单角色 JSON
                </Button>
                <Button
                  loading={busyKey === 'single-markdown'}
                  onClick={() =>
                    void runExport(
                      'single-markdown',
                      async () => electronApi.exportSingleMarkdown(await requireCharacter()),
                      '单角色 Markdown 导出成功'
                    )
                  }
                >
                  导出单角色 Markdown
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="批量导出" className="content-card">
        <Space wrap>
          <Button
            type="primary"
            loading={busyKey === 'all-json'}
            onClick={() => void runExport('all-json', electronApi.exportAllJson, '全部角色 JSON 导出成功')}
          >
            导出全部角色 JSON
          </Button>
          <Button
            loading={busyKey === 'all-csv'}
            onClick={() => void runExport('all-csv', electronApi.exportAllCsv, '全部角色 CSV 导出成功')}
          >
            导出全部角色 CSV
          </Button>
        </Space>
      </Card>
    </Space>
  )
}
