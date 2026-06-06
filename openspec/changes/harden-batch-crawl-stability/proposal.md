## Why

The crawler can intermittently stall during longer runs. When this happens, the visible browser window may stop opening the next character page, and the batch task appears frozen even though the process is still running.

The current all-character flow launches and closes a full Chromium browser for every character. That increases overhead and makes long sequential runs more fragile.

## What Changes

- Reuse a single Playwright browser session during batch crawling
- Open and close fresh pages within the shared browser instead of relaunching Chromium per character
- Add page-level default timeouts and clearer progress logs around page opening
- Keep single-character crawling behavior compatible with the existing IPC and task history flows

## Impact

- Python crawler internals only
- No Electron security changes
- No database or concurrency changes
