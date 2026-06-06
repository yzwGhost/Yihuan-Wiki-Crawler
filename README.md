# yihuan-crawler-desktop

一款基于 Electron + React + TypeScript + Python Playwright 的异环 Wiki 桌面爬取工具。

当前已支持：

- 单角色爬取
- 全部角色顺序爬取
- 实时日志
- 角色列表与角色详情
- 图片预览
- 任务历史
- 失败重试
- 断点续爬
- JSON / CSV / Markdown 导出
- 本地设置持久化

## 启动项目

### 1. 安装 Node 依赖

```bash
npm install
```

### 2. 启动桌面应用

```bash
npm run dev
```

### 3. 打包前构建检查

```bash
npm run build
```

## Python 环境安装

进入 `python/` 目录后初始化虚拟环境：

```bash
cd python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 安装 Playwright Chromium

Python 依赖安装完成后执行：

```bash
playwright install chromium
```

如果你使用的是虚拟环境，确保命令运行在已激活的 `.venv` 中。

## 常用目录

- 角色数据：`data/characters/`
- 图片资源：`data/images/`
- 任务历史：`data/tasks/`
- 导出文件：`data/exports/`
- 应用设置：`data/settings.json`

## 常见操作

### 单角色爬取

1. 打开“爬取任务”
2. 选择“单角色”
3. 输入角色 URL
4. 点击“开始”

### 全部角色爬取

1. 打开“爬取任务”
2. 选择“全部角色”
3. 按需开启“断点续爬”
4. 点击“开始”

### 导出数据

打开“数据导出”页后可执行：

- 导出全部角色 JSON
- 导出单角色 JSON
- 导出全部角色 CSV
- 导出单角色 Markdown
- 打开导出目录
- 选择导出目录

### 保存设置

打开“设置”页后可修改：

- Python 路径
- 输出目录
- 导出目录
- 下载图片
- 无头模式
- 最大点击次数
- 页面等待时间
- 点击等待时间
- 断点续爬
- 详细日志

保存后会写入 `data/settings.json`，下次启动仍然生效。

## 常见问题

### 1. 点击开始后没有反应

优先检查：

- Python 是否已安装
- `data/settings.json` 中的 `pythonPath` 是否正确
- Playwright Chromium 是否已安装

### 2. 实时日志乱码

当前版本已经强制 Electron 与 Python 之间使用 UTF-8。如果仍出现乱码，请重新启动应用后再创建新任务，旧任务日志不会自动重写。

### 3. 图片预览不显示

请先确认：

- 对应角色 JSON 已成功生成
- 图片已下载到 `data/images/角色名/`
- 角色详情中的图片标签页使用的是最新任务生成的数据

### 4. 全部角色爬取中断后如何继续

打开“任务历史”，找到未完成任务后点击“继续任务”即可。

## 开发说明

- Electron 安全配置保持：
  - `contextIsolation: true`
  - `nodeIntegration: false`
- 不引入 FastAPI
- 不引入 SQLite
- 当前全部角色模式保持顺序爬取，不做并发
