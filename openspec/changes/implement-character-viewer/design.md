# Design

## Data Source

The viewer reads JSON files from `data/characters`. It ignores aggregate files such as `all_characters.json` and `candidate_links.json`.

If the directory does not exist, the list API returns an empty array.

If one file fails to parse, the main process logs the error and skips that file so the renderer still receives the remaining valid records.

## IPC

- `characters:list` returns summary rows with counts and local file paths for actions.
- `characters:detail` returns the full JSON payload plus enriched local metadata:
  - JSON file path
  - image directory path
  - image absolute paths and file URLs for local preview
  - formatted raw JSON text
- `file:openPath` opens a file or directory using Electron shell APIs.

## Renderer

The Character List page loads summaries on mount and shows them in an Ant Design table.

The detail flow is lazy:

1. User clicks `查看详情`
2. Renderer requests `characters:detail`
3. Drawer opens with tabs for sections, images, and raw JSON

This keeps the table payload light while still allowing full detail review.
