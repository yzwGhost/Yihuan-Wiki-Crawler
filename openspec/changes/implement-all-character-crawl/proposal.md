# Proposal

## Why

The crawler currently supports only one character URL at a time. To make the desktop tool useful for broader data collection, it needs a stable sequential all-character mode with structured progress reporting.

## What Changes

- Add `mode=all` support from the renderer through Electron IPC to Python CLI.
- Discover candidate character links from configured discovery pages.
- Save `data/characters/candidate_links.json`.
- Crawl discovered character URLs sequentially and continue after individual failures.
- Track running state, mode, progress, success count, failed count, and logs in the renderer store.

## Impact

- Preserves the current Electron/React/Python subprocess architecture.
- Does not introduce FastAPI or concurrent crawling.
- Extends the existing structured log contract to cover discovery and batch progress.
