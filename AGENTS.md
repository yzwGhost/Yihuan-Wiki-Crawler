# AGENTS.md

## OpenSpec workflow

This project uses OpenSpec for spec-driven development.

Before implementing any non-trivial feature, bug fix, refactor, or architecture change:

1. Check existing OpenSpec context:
   - Read `openspec/specs/`
   - Read active changes under `openspec/changes/`
   - Run `openspec list` or related OpenSpec commands when available

2. For new features:
   - Create or update an OpenSpec change first
   - Include proposal, design notes, task list, and spec delta
   - Do not start implementation until the change scope is clear

3. During implementation:
   - Follow `openspec/changes/<change-name>/tasks.md`
   - Complete tasks one by one
   - Update the task checklist after finishing each task
   - Do not add unrelated refactors

4. After implementation:
   - Run lint/typecheck/tests when available
   - Verify the implementation matches the OpenSpec requirements
   - Sync or archive the OpenSpec change after completion

## Project rules

- Keep generated JSON readable and formatted with indentation.
- Do not store large scraped text blocks in one-line JSON fields.
- Separate crawler logic, parser logic, image downloader, desktop UI, and data storage.
- Avoid mixing Electron/React UI code with Python crawler internals.
- Do not change unrelated files unless necessary.

## Project Overview

This project is a desktop application for crawling, managing, previewing, and exporting character data from the GameKee Yihuan Wiki.

The application uses:

* Electron
* React
* TypeScript
* Ant Design
* Python
* Playwright
* BeautifulSoup
* Local JSON storage
* Optional SQLite storage in later stages

The main goal is to provide a visual desktop tool that can:

1. Crawl a single Yihuan character page.
2. Crawl all discoverable Yihuan character pages.
3. Extract default character sections.
4. Extract clickable popup / overlay / tab content.
5. Download character-related images.
6. Save clean JSON files.
7. Display characters, sections, logs, images, and task progress in the desktop UI.
8. Export crawled data.

---

## Development Principles

Follow these principles strictly:

1. Keep Electron, React, and Python responsibilities separated.
2. Do not put crawler logic inside React components.
3. Do not put crawler logic inside the Electron renderer process.
4. Electron main process should only coordinate:

   * Window creation
   * IPC communication
   * Python child process management
   * Local file access
   * Settings access
5. Python is responsible for all crawling, parsing, downloading, and data writing.
6. React is responsible only for UI display and user interaction.
7. Keep code modular and maintainable.
8. Avoid large single-file implementations unless specifically requested.
9. Use TypeScript types for all renderer and IPC data structures.
10. Use structured JSON logs between Python and Electron.

---

## Security Rules

Electron security settings must remain safe:

```ts
contextIsolation: true
nodeIntegration: false
```

Never expose `ipcRenderer` directly to the renderer.

Use `contextBridge.exposeInMainWorld` in `preload.ts`.

Renderer code must call APIs through:

```ts
window.yihuanApi
```

Do not access Node.js APIs directly from React components.

---

## Recommended Project Structure

Use this structure as the target architecture:

```txt
yihuan-crawler-desktop/
├─ package.json
├─ electron.vite.config.ts
├─ tsconfig.json
├─ README.md
├─ AGENTS.md
│
├─ src/
│  ├─ main/
│  │  ├─ index.ts
│  │  ├─ preload.ts
│  │  ├─ ipc/
│  │  │  ├─ crawler.ipc.ts
│  │  │  ├─ file.ipc.ts
│  │  │  └─ settings.ipc.ts
│  │  ├─ services/
│  │  │  ├─ python.service.ts
│  │  │  ├─ path.service.ts
│  │  │  └─ settings.service.ts
│  │  └─ types/
│  │     └─ ipc.ts
│  │
│  └─ renderer/
│     ├─ index.html
│     └─ src/
│        ├─ main.tsx
│        ├─ App.tsx
│        ├─ routes/
│        │  ├─ Dashboard.tsx
│        │  ├─ CrawlTask.tsx
│        │  ├─ CharacterList.tsx
│        │  ├─ ImageManager.tsx
│        │  ├─ ExportData.tsx
│        │  └─ Settings.tsx
│        ├─ components/
│        │  ├─ AppLayout.tsx
│        │  ├─ LogPanel.tsx
│        │  ├─ TaskProgress.tsx
│        │  ├─ CharacterDetailDrawer.tsx
│        │  ├─ ImageGrid.tsx
│        │  └─ JsonViewer.tsx
│        ├─ stores/
│        │  ├─ crawlerStore.ts
│        │  ├─ characterStore.ts
│        │  └─ settingsStore.ts
│        ├─ api/
│        │  └─ electronApi.ts
│        ├─ types/
│        │  ├─ character.ts
│        │  ├─ crawler.ts
│        │  └─ settings.ts
│        └─ styles/
│           └─ global.css
│
├─ python/
│  ├─ requirements.txt
│  └─ crawler/
│     ├─ main.py
│     ├─ spider.py
│     ├─ parser.py
│     ├─ downloader.py
│     ├─ storage.py
│     ├─ config.py
│     └─ models.py
│
├─ data/
│  ├─ characters/
│  ├─ images/
│  ├─ logs/
│  └─ settings.json
│
└─ resources/
   └─ icon.ico
```

---

## Frontend Rules

Use:

* React
* TypeScript
* Ant Design
* Zustand
* dayjs
* CodeMirror for JSON preview if needed
* ECharts only when charts are useful

Recommended pages:

1. `Dashboard`
2. `CrawlTask`
3. `CharacterList`
4. `ImageManager`
5. `ExportData`
6. `Settings`

Do not place too much logic inside route components.

Move reusable UI into `components/`.

Move state logic into `stores/`.

Move IPC calls into `api/electronApi.ts`.

---

## UI Requirements

### Dashboard

Show:

* Total character count
* Total image count
* Failed image count
* Latest crawl time
* Current task status

### CrawlTask

Must include:

* Crawl mode selection:

  * Single character
  * All characters
* URL input for single character mode
* Download images switch
* Headless mode switch
* Max click count input
* Start button
* Stop button
* Progress display
* Real-time log panel

### CharacterList

Must include:

* Search by character name
* Table of crawled characters
* Character URL
* Section count
* Interactive section count
* Image count
* Failed image count
* Actions:

  * View detail
  * Open JSON
  * Open image folder
  * Re-crawl

### CharacterDetailDrawer

Must include tabs:

1. Default sections
2. Interactive sections
3. Images
4. Raw JSON

Use Ant Design components:

* Drawer
* Tabs
* Collapse
* List
* Image.PreviewGroup
* Descriptions

### ImageManager

Must include:

* Character filter
* Image preview
* Local path display
* Failed image list
* Open image folder action

### Settings

Must include:

* Python path
* Output directory
* Download images default
* Headless mode default
* Max click count
* Page wait time
* Click wait time

Settings should be saved to:

```txt
data/settings.json
```

---

## IPC API Contract

Expose these APIs through `window.yihuanApi`.

### Renderer to Main

```ts
startCrawler(options: CrawlerStartOptions): Promise<void>
stopCrawler(): Promise<void>
getCharacters(): Promise<CharacterSummary[]>
getCharacterDetail(name: string): Promise<CharacterDetail>
openPath(path: string): Promise<void>
getSettings(): Promise<AppSettings>
saveSettings(settings: AppSettings): Promise<void>
ping(): Promise<string>
```

### Main to Renderer Events

```ts
onCrawlerMessage(callback: (message: CrawlerMessage) => void): () => void
onCrawlerDone(callback: (result: CrawlerDonePayload) => void): () => void
onCrawlerError(callback: (error: CrawlerErrorPayload) => void): () => void
```

Event listeners must return an unsubscribe function.

---

## IPC Channel Names

Use stable channel names:

```txt
crawler:start
crawler:stop
crawler:message
crawler:done
crawler:error

characters:list
characters:detail

file:openPath

settings:get
settings:save

app:ping
```

Do not create random channel names inside components.

Keep IPC names centralized.

---

## Python Process Rules

Electron main should start Python using `child_process.spawn`.

Do not use blocking process calls.

The Python process must print one JSON object per line.

Example Python stdout line:

```json
{"type":"log","message":"爬虫启动"}
```

Use `flush=True` in Python print calls.

Example:

```python
print(json.dumps(payload, ensure_ascii=False), flush=True)
```

Electron main should parse stdout line by line.

If a line is not valid JSON, forward it as a plain log message.

Prevent duplicate crawler processes.

If a crawler process is already running, do not start another one.

Stopping the crawler should kill the Python child process safely.

---

## Python CLI Contract

`python/crawler/main.py` must support:

```bash
python main.py --mode single --url https://www.gamekee.com/yh/669570.html --output ../../data --download-images true --headless false --max-click 40
```

```bash
python main.py --mode all --output ../../data --download-images true --headless true --max-click 40
```

Required arguments:

```txt
--mode single | all
--output output directory
```

Optional arguments:

```txt
--url character detail URL
--download-images true | false
--headless true | false
--max-click number
--page-wait number
--click-wait number
```

If `--mode single`, `--url` is required.

If `--mode all`, discover all candidate character URLs from configured discover URLs.

---

## Python Structured Log Types

Python should emit these message types:

```json
{"type":"log","message":"message"}
```

```json
{"type":"progress","current":1,"total":20,"message":"正在处理：角色名"}
```

```json
{"type":"character_done","name":"角色名","url":"https://www.gamekee.com/yh/xxxxxx.html"}
```

```json
{"type":"character_failed","url":"https://www.gamekee.com/yh/xxxxxx.html","error":"error message"}
```

```json
{"type":"image_failed","url":"https://xxx.png","error":"HTTP 403"}
```

```json
{"type":"done","success":18,"failed":2}
```

Do not output only human-readable logs when structured logs are expected.

---

## Python Crawler Rules

The crawler must:

1. Use Playwright for dynamic rendering.
2. Use BeautifulSoup for parsing rendered HTML.
3. Automatically scroll pages to trigger lazy-loaded content.
4. Extract images from:

   * `img src`
   * `data-src`
   * `data-original`
   * `data-lazy-src`
   * `srcset`
   * `source srcset`
   * CSS `background-image`
5. Click only explicitly useful text buttons.
6. Avoid clicking comments, ads, community posts, guides, or unrelated links.
7. Filter out garbage content.
8. Save clean JSON.
9. Download images with proper headers.
10. Record failed downloads.

---

## Strict Click Texts

Only click elements whose text matches or contains these values:

```python
STRICT_CLICK_TEXTS = [
    "点击查看",
    "查看升级效果",
    "面板数据",
    "角色立绘",
    "Lv.1",
    "Lv.2",
    "Lv.3",
    "Lv.4",
    "Lv.5",
    "Lv.6",
    "1级觉醒",
    "2级觉醒",
    "3级觉醒",
    "4级觉醒",
    "5级觉醒",
    "6级觉醒",
]
```

Do not click generic texts like:

```txt
查看
详情
更多
攻略
评论
分享
```

These cause too many false clicks.

---

## Content Filtering Rules

Keep these sections if found:

```python
KEEP_SECTIONS = [
    "基础信息",
    "突破",
    "异能",
    "觉醒",
    "档案详情",
    "邂逅",
    "语音记录",
    "喜爱礼物",
    "好感等级奖励",
    "都市特技",
    "共鸣效果",
]
```

Stop reading when these sections appear:

```python
STOP_SECTIONS = [
    "角色攻略",
    "角色相关影音",
    "评论",
    "来自wiki",
    "history record",
    "投诉或建议",
    "举报",
    "更换绑定文章",
    "There is no more data available",
]
```

Filter out junk content including:

```txt
登录
注册
发帖
评论消息
系统消息
分享
赞同
关注
原创
身份认证
投诉或建议
举报
```

---

## Character JSON Output Format

Each character JSON file must use this format:

```json
{
  "name": "角色名",
  "url": "https://www.gamekee.com/yh/xxxxxx.html",
  "default_sections": [
    {
      "title": "基础信息",
      "lines": [
        "角色名",
        "称号",
        "稀有度",
        "SSR"
      ]
    }
  ],
  "interactive_sections": [
    {
      "title": "查看升级效果",
      "type": "overlay",
      "button_text": "查看升级效果",
      "lines": [
        "等级1",
        "造成100%伤害"
      ],
      "images": []
    }
  ],
  "images": {
    "urls": [],
    "downloaded": [
      {
        "url": "https://xxx.png",
        "local_path": "data/images/角色名/001_xxx.png",
        "content_type": "image/png",
        "status": "downloaded"
      }
    ],
    "download_failed": []
  }
}
```

Important:

* Do not save long section content as one large string.
* Use `lines` arrays.
* Keep JSON human-readable.
* Use `ensure_ascii=False`.
* Use `indent=2`.

---

## Output File Rules

Data should be saved into:

```txt
data/
├─ characters/
│  ├─ 角色名.json
│  └─ all_characters.json
├─ images/
│  └─ 角色名/
│     ├─ 001_xxx.png
│     └─ 002_xxx.webp
├─ logs/
└─ settings.json
```

Candidate URLs should be saved as:

```txt
data/characters/candidate_links.json
```

---

## Image Download Rules

When downloading images, use headers:

```txt
Referer: current character page URL
Origin: https://www.gamekee.com
User-Agent: browser-like UA
Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8
```

Handle:

```txt
HTTP 403
HTTP 404
Timeout
Non-image content-type
Empty response body
```

Failed downloads must be recorded in `download_failed`.

Do not crash the whole crawler because one image failed.

---

## URL Discovery Rules

Only accept character detail URLs matching:

```regex
/yh/\d+\.html
```

Do not accept:

```txt
/yh/list
/yh/search
/yh/post
/yh/bbs
/yh/news
```

Discovery URLs should be configurable.

Default discovery URLs:

```python
DISCOVER_URLS = [
    "https://www.gamekee.com/yh/",
    "https://www.gamekee.com/yh/?utm_source=chatgpt.com",
]
```

---

## State Management Rules

Use Zustand stores.

Recommended stores:

```txt
crawlerStore.ts
characterStore.ts
settingsStore.ts
```

`crawlerStore` should track:

```ts
running: boolean
mode: 'single' | 'all'
current: number
total: number
currentMessage: string
logs: string[]
successCount: number
failedCount: number
```

`characterStore` should track:

```ts
characters: CharacterSummary[]
selectedCharacter?: CharacterDetail
loading: boolean
```

---

## Coding Style

### TypeScript

1. Use explicit interfaces for IPC payloads.
2. Keep IPC types in `src/main/types` or `src/renderer/src/types`.
3. Do not use `any` unless unavoidable.
4. Keep React components small.
5. Move reusable logic into hooks or stores.
6. Do not directly call IPC inside deeply nested UI components when a store/action can handle it.

### Python

1. Use clear module separation.
2. Keep crawler settings centralized.
3. Use functions with type hints.
4. Do not use OCR.
5. Do not crash on one failed page.
6. Always save partial results.
7. Always flush structured logs.
8. Keep output JSON readable.

---

## Recommended Development Stages

### Stage 1: Project Skeleton

Implement:

1. Electron + React + TypeScript project.
2. Ant Design layout.
3. Left menu pages:

   * Dashboard
   * CrawlTask
   * CharacterList
   * ImageManager
   * ExportData
   * Settings
4. Safe preload bridge.
5. Ping / pong IPC test.

Acceptance:

```txt
npm run dev starts the desktop app.
Renderer can call main through window.yihuanApi.ping().
```

---

### Stage 2: Python Process Integration

Implement:

1. `python/crawler/main.py`
2. Mock JSON-line log output.
3. `python.service.ts`
4. `crawler:start`
5. `crawler:stop`
6. LogPanel in React.

Acceptance:

```txt
Clicking Start launches Python.
React receives real-time JSON logs.
Clicking Stop kills Python.
```

---

### Stage 3: Single Character Crawl

Implement:

1. Real Python crawler for one URL.
2. Save one character JSON.
3. Download images.
4. Show progress in React.

Acceptance:

```txt
Input one GameKee character URL.
Click Start.
A JSON file and image folder are generated.
Logs appear in UI.
```

---

### Stage 4: All Character Crawl

Implement:

1. Discover candidate URLs.
2. Crawl each character sequentially.
3. Save `candidate_links.json`.
4. Save `all_characters.json`.
5. Continue on individual failures.

Acceptance:

```txt
All mode discovers URLs and crawls multiple characters.
Partial failures do not stop the full task.
```

---

### Stage 5: Data Viewer

Implement:

1. Read saved character JSON files.
2. Show character table.
3. Show detail drawer.
4. Show images.
5. Show raw JSON.

Acceptance:

```txt
Crawled data can be browsed from the desktop app.
```

---

### Stage 6: Settings and Export

Implement:

1. Settings read/write.
2. Output directory setting.
3. Headless setting.
4. Max click setting.
5. Export JSON.
6. Open output folder.

Acceptance:

```txt
Settings persist after restart.
Export and open-folder actions work.
```

---

## Commands

Frontend:

```bash
npm install
npm run dev
```

Python:

```bash
cd python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

Run Python manually:

```bash
python crawler/main.py --mode single --url https://www.gamekee.com/yh/669570.html --output ../data --download-images true --headless false --max-click 40
```

---

## Do Not Do

Do not:

1. Put crawler logic in React.
2. Disable Electron security settings.
3. Expose raw `ipcRenderer` to the renderer.
4. Click every button on the web page.
5. Store large text as one-line JSON strings.
6. Crash the crawler on a single failed image.
7. Hardcode all paths without using a path service.
8. Assume all images are in `img src`.
9. Assume all character links are visible without scrolling.
10. Implement advanced features before MVP works.

---

## MVP Acceptance Checklist

The MVP is complete when:

* [ ] App starts with `npm run dev`.
* [ ] Left menu works.
* [ ] `window.yihuanApi.ping()` works.
* [ ] Python process can be started and stopped.
* [ ] Python logs stream to the UI.
* [ ] Single character crawl works.
* [ ] All character crawl works.
* [ ] Character JSON files are saved.
* [ ] Images are downloaded.
* [ ] Failed downloads are recorded.
* [ ] Character list page displays saved characters.
* [ ] Character detail drawer displays sections and images.
* [ ] Settings are saved to `data/settings.json`.

---

## Notes for AI Coding Agents

When implementing this project:

1. Work in small stages.
2. Do not generate the entire app in one uncontrolled step.
3. After each stage, ensure the project runs.
4. Prefer simple working code over over-engineered abstractions.
5. Preserve all project boundaries:

   * React for UI
   * Electron main for orchestration
   * Python for crawling
6. If a website selector is uncertain, make it configurable.
7. Keep the crawler resilient to page structure changes.
8. Always save partial crawl results.
9. Keep logs readable for users.
10. Keep JSON output clean and stable.
