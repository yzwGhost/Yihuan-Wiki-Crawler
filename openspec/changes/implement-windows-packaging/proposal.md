## Why

The desktop crawler now has enough core functionality to be packaged for Windows, but it still assumes a development-time Python entrypoint and a project-root `data/` directory. That will break once the app is installed because packaged apps should not write into the installation directory, and the crawler runtime needs a stable executable path.

This stage adds Windows packaging, packaged Python runtime handling, user-data storage, and environment checks so the installed app can validate its runtime before crawling.

## What Changes

- Add `electron-builder` configuration for Windows NSIS packaging
- Add resource layout under `resources/` for icon and packaged Python runtime
- Refactor main-process path handling to distinguish development vs packaged runtime using `app.isPackaged`
- Route packaged data writes to `app.getPath("userData")/data`
- Update Python process launching to use:
  - development Python + `python/crawler/main.py`
  - packaged `resources/python/yihuan-crawler.exe`
- Add environment check IPC and settings-page UI
- Extend README with Python packaging, Electron packaging, installer generation, and troubleshooting

## Impact

- Main-process services and IPC
- Settings page UI
- Packaging scripts and repository resources
- Existing crawl, viewer, export, and task features remain supported
