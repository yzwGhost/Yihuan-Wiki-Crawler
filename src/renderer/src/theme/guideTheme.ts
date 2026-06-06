import { theme, type ThemeConfig } from 'antd'

export const guideTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#ffd400',
    colorInfo: '#ffd400',
    colorSuccess: '#95d178',
    colorWarning: '#ffd400',
    colorError: '#ff7a6a',
    colorTextBase: '#f3f3f3',
    colorBgBase: '#0c0c0d',
    colorBgContainer: '#1a1a1b',
    colorBgElevated: '#151516',
    colorFillSecondary: '#202022',
    colorFillTertiary: '#242427',
    colorBorder: 'rgba(255,255,255,0.08)',
    colorBorderSecondary: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderRadiusLG: 20,
    wireframe: false,
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    boxShadow: 'none',
    boxShadowSecondary: 'none'
  },
  components: {
    Layout: {
      headerBg: 'rgba(14,14,15,0.96)',
      siderBg: 'rgba(14,14,15,0.96)',
      bodyBg: '#0c0c0d',
      triggerBg: '#151516',
      triggerColor: '#f3f3f3'
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(243,243,243,0.72)',
      darkItemHoverColor: '#f3f3f3',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemSelectedBg: '#ffd400',
      darkItemSelectedColor: '#111111',
      darkGroupTitleColor: 'rgba(243,243,243,0.42)',
      itemBorderRadius: 14,
      itemHeight: 48
    },
    Card: {
      colorBgContainer: 'rgba(22,22,23,0.96)',
      headerBg: 'rgba(22,22,23,0.96)',
      colorBorderSecondary: 'rgba(255,255,255,0.08)',
      bodyPadding: 24,
      headerHeight: 60
    },
    Button: {
      primaryColor: '#111111',
      colorPrimary: '#ffd400',
      colorPrimaryHover: '#ffe04f',
      colorPrimaryActive: '#f2cb00',
      defaultBg: 'transparent',
      defaultColor: '#f3f3f3',
      defaultBorderColor: 'rgba(255,255,255,0.14)',
      dangerColor: '#ffd8d2',
      colorError: '#ff7a6a',
      colorErrorHover: '#ff8b7e',
      colorErrorActive: '#ef6b5a'
    },
    Input: {
      colorBgContainer: '#161617',
      colorBorder: 'rgba(255,255,255,0.14)',
      hoverBorderColor: 'rgba(255,212,0,0.42)',
      activeBorderColor: '#ffd400'
    },
    InputNumber: {
      colorBgContainer: '#161617',
      colorBorder: 'rgba(255,255,255,0.14)',
      hoverBorderColor: 'rgba(255,212,0,0.42)',
      activeBorderColor: '#ffd400'
    },
    Select: {
      colorBgContainer: '#161617',
      colorBorder: 'rgba(255,255,255,0.14)',
      optionSelectedBg: 'rgba(255,212,0,0.16)',
      optionActiveBg: 'rgba(255,255,255,0.06)'
    },
    Table: {
      headerBg: 'rgba(255,255,255,0.03)',
      headerColor: '#f3f3f3',
      colorBgContainer: 'transparent',
      rowHoverBg: 'rgba(255,255,255,0.025)',
      borderColor: 'rgba(255,255,255,0.08)',
      footerBg: 'transparent'
    },
    Drawer: {
      colorBgElevated: '#151516',
      colorBgMask: 'rgba(0,0,0,0.55)'
    },
    Tabs: {
      itemColor: 'rgba(243,243,243,0.72)',
      itemSelectedColor: '#ffd400',
      itemHoverColor: '#ffe04f',
      inkBarColor: '#ffd400'
    },
    Collapse: {
      headerBg: 'rgba(255,255,255,0.02)',
      contentBg: 'transparent',
      borderColor: 'rgba(255,255,255,0.08)'
    },
    Alert: {
      colorInfoBg: 'rgba(255,255,255,0.03)',
      colorInfoBorder: 'rgba(255,255,255,0.08)'
    },
    Progress: {
      defaultColor: '#ffd400',
      remainingColor: 'rgba(255,255,255,0.08)'
    },
    Tag: {
      defaultBg: 'rgba(255,255,255,0.08)',
      defaultColor: '#f3f3f3',
      defaultBorderColor: 'transparent'
    },
    Switch: {
      colorPrimary: '#ffd400',
      colorPrimaryHover: '#ffe04f',
      colorTextQuaternary: 'rgba(255,255,255,0.18)'
    }
  }
}
