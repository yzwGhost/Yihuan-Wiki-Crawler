# Proposal

## Why

Stage 4 needs a desktop-facing data viewer so users can inspect crawled character JSON files, open the saved JSON and image folders, and review extracted sections and images without leaving the app.

## What Changes

- Add Electron IPC handlers for listing character JSON files and reading one character detail document.
- Add Electron IPC handler for opening a local file or directory.
- Expose the new APIs through `window.yihuanApi`.
- Add a Character List page with table-based summaries and actions.
- Add a Character Detail drawer with tabs for sections, images, and raw JSON.

## Impact

- Preserves the current Electron/React/Python crawler boundaries.
- Makes the existing `data/characters` and `data/images` outputs directly usable from the desktop UI.
