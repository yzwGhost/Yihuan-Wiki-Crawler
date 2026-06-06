import { Typography } from 'antd'

const { Paragraph, Title } = Typography

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps): JSX.Element {
  return (
    <div className="page-card">
      <Title level={2}>{title}</Title>
      <Paragraph>{description}</Paragraph>
      <Paragraph>
        当前页面仍是占位区域，后续会继续接入真实业务能力，同时保持整套界面简洁、清晰，并更贴近游戏攻略站的视觉表达。
      </Paragraph>
    </div>
  )
}
