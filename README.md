# yihuan-crawler-desktop

异环数据爬取工具是一个基于 Electron、React、TypeScript、Ant Design 和 Python Playwright 的 Windows 桌面应用，用于抓取、查看、管理和导出 GameKee 异环 Wiki 的角色资料。

当前版本支持：

- 单角色爬取
- 全部角色顺序爬取
- 实时日志
- 角色列表与角色详情
- 图片预览
- 任务历史
- 失败重试
- 断点续爬
- JSON / CSV / Markdown 导出
- 设置持久化
- Windows 打包

## 开发环境启动

### 1. 安装 Node.js 依赖

```bash
npm install
```

### 2. 启动桌面应用

```bash
npm run dev
```

### 3. 构建 Electron 代码

```bash
npm run build
```

## Python 环境安装

进入 `python/` 目录后初始化虚拟环境并安装依赖：

```bash
cd python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 安装 Playwright Chromium

在已激活的 Python 虚拟环境中执行：

```bash
playwright install chromium
```

## Python 爬虫打包

第一版使用 PyInstaller 将 Python 爬虫打包为独立 exe：

```bash
cd python
.venv\Scripts\activate
pip install pyinstaller
pyinstaller -F crawler/main.py -n yihuan-crawler
```

打包完成后，将生成的 exe 复制到：

```txt
resources/python/yihuan-crawler.exe
```

通常 PyInstaller 输出文件位于：

```txt
python/dist/yihuan-crawler.exe
```

## Electron 打包

在项目根目录执行：

```bash
npm run dist
```

如只想生成解包目录用于检查：

```bash
npm run pack
```

## Windows 安装包生成

`npm run dist` 成功后，会在打包输出目录生成 Windows NSIS 安装包，文件名格式为：

```txt
YihuanCrawler-${version}-${arch}.exe
```

安装后，应用数据不会写入安装目录，而是写入：

```txt
%APPDATA%/../Local/<应用目录>/data
```

程序内部通过 `app.getPath("userData")` 管理这些数据。

## 开发环境与打包环境的数据目录

### 开发环境

数据默认写入项目根目录：

```txt
data/
├─ characters/
├─ images/
├─ exports/
├─ tasks/
└─ settings.json
```

### 打包环境

数据默认写入：

```txt
userData/data/
├─ characters/
├─ images/
├─ exports/
├─ tasks/
└─ settings.json
```

## 环境检查

设置页提供“环境检查”按钮，会检查：

- 爬虫可执行文件是否存在
- Playwright Chromium 是否可用
- 输出目录是否可写
- 设置文件是否可读写

## 常见问题

### 1. 找不到 Python

请检查：

- `python/.venv/Scripts/python.exe` 是否存在
- 设置页中的 `Python 路径` 是否正确
- 开发环境是否已安装并激活 Python

### 2. Playwright Chromium 缺失

请在 Python 虚拟环境中执行：

```bash
playwright install chromium
```

如果是打包后的 exe，请重新确认打包时可访问 Playwright 浏览器依赖，或在设置页先执行“环境检查”查看提示。

### 3. 图片下载失败

图片下载失败通常与以下原因有关：

- 目标站点防盗链
- 图片 URL 已失效
- 网络波动
- 返回内容不是图片

失败图片会记录到角色 JSON 和任务历史中，可在任务历史里执行“重试失败图片”。

### 4. 数据目录在哪里

- 开发环境：项目根目录 `data/`
- 打包环境：`app.getPath("userData")/data`

可在设置页执行环境检查，直接查看当前数据目录路径。

### 5. 杀毒软件误报

PyInstaller 打包的 exe 和 Electron 安装包有时会被 Windows Defender 或第三方杀毒软件误报。若出现此问题：

- 确认文件来源为当前项目本地构建结果
- 尝试将项目目录加入信任列表
- 尽量使用本地虚拟环境和本地打包结果，不要混用来历不明的 exe

## .gitignore 建议

项目默认应忽略以下目录或文件：

- `node_modules`
- `dist`
- `out`
- `data/images`
- `data/characters`
- `data/exports`
- `python/.venv`
- `__pycache__`

## 开发说明

- Electron 安全设置保持：
  - `contextIsolation: true`
  - `nodeIntegration: false`
- 不引入 FastAPI
- 不引入 SQLite
- 当前全部角色模式保持顺序爬取，不做并发
