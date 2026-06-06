## ADDED Requirements

### Requirement: Packaged app shall store data outside the install directory

The application SHALL write runtime data into the user data directory when packaged.

#### Scenario: Packaged app saves crawl data

- **WHEN** `app.isPackaged` is `true`
- **THEN** runtime data is stored under `app.getPath("userData")/data`
- **AND** characters, images, exports, tasks, logs, and settings are written there

#### Scenario: Development app saves crawl data

- **WHEN** `app.isPackaged` is `false`
- **THEN** runtime data continues to use the project-root `data/` directory

### Requirement: Python runtime path shall support both development and packaged modes

The main process SHALL resolve crawler executable paths through one shared path service.

#### Scenario: Development crawler launch

- **WHEN** the app runs in development mode
- **THEN** Electron launches a Python interpreter with `python/crawler/main.py`
- **AND** prefers the local virtualenv interpreter when available

#### Scenario: Packaged crawler launch

- **WHEN** the app runs in packaged mode
- **THEN** Electron launches `process.resourcesPath/python/yihuan-crawler.exe`

### Requirement: Environment check shall validate crawler runtime before crawling

The application SHALL expose an environment check action in the settings page.

#### Scenario: Run environment check

- **WHEN** the user clicks the environment check button
- **THEN** Electron returns:
  - crawler executable path
  - data directory path
  - output directory writability
  - settings file readability/writability
  - Playwright availability result

### Requirement: Windows packaging shall include Python runtime resources

The build configuration SHALL package the Python runtime resources for Windows installers.

#### Scenario: Build Windows installer

- **WHEN** the user runs the installer build command
- **THEN** Electron Builder targets Windows NSIS
- **AND** includes `resources/python` as extra resources
- **AND** emits installer artifacts using the configured artifact name pattern
