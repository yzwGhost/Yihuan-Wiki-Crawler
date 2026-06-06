# Design

## Batch Crawl Flow

1. Renderer submits `mode=all` and shared crawl options.
2. Electron main spawns the existing Python CLI with `--mode all`.
3. Python scans `DISCOVER_URLS`, extracts unique candidate character links, and saves them locally.
4. Python crawls each candidate sequentially via `crawl_single_character`.
5. Python emits structured JSON-line progress, success, and failure events for the renderer.

## Discovery

Discovery uses Playwright-rendered pages and extracts anchor URLs matching `/yh/<digits>.html`. Aggregate or unrelated routes are ignored.

## Error Handling

- If zero candidates are found, Python emits an error log and finishes without crashing.
- If one character fails, Python emits `character_failed` and continues with the next candidate.
- Renderer progress counts are updated from event types and finalized on `done`.
