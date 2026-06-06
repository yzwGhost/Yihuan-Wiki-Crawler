## Why

The desktop crawler already supports crawling, browsing character data, viewing task history, and retrying failures, but it still lacks practical output workflows and persistent runtime configuration. Users cannot export the collected data in multiple formats, manage shared crawler defaults through the UI, or rely on basic onboarding documentation before packaging.

Adding export tools, a complete settings flow, and project documentation cleanup will make the app usable as a day-to-day desktop tool without changing the existing Electron security model or introducing a database.

## What Changes

- Add JSON/CSV/Markdown export flows under `data/exports/`
- Add export IPC and preload APIs for all-data and single-character exports
- Add persistent application settings in `data/settings.json`
- Add settings IPC, preload APIs, and a renderer settings store
- Update the crawl task page to use settings defaults without forcing temporary changes to persist
- Implement renderer `ExportData` and `Settings` pages
- Add README and `.gitignore` for startup, Python/Playwright installation, and packaging hygiene

## Impact

- New shared TypeScript types for settings and export operations
- New Electron main export and settings services plus IPC registration
- New renderer settings store and route components
- Existing crawl, character viewer, task history, and retry flows remain supported
