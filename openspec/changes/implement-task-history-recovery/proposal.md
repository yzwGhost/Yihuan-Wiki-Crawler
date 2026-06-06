## Why

The crawler currently supports single-character crawling, all-character crawling, and live progress updates, but it does not preserve crawl execution history in a structured way. Users cannot inspect prior runs, resume interrupted batch crawls, or selectively retry failed characters and failed image downloads.

Adding task history, resume support, and retry flows will make long-running batch jobs safer and more practical without introducing a database or changing the existing Electron security model.

## What Changes

- Add JSON-based task history persistence under `data/tasks/tasks.json`
- Record task lifecycle updates during crawl start, discovery, per-character success/failure, per-image failure, completion, and abnormal exit
- Add batch resume support with `--resume true|false`
- Add retry flows for failed characters and failed images with dedicated Python CLI flags
- Expose task history, task detail, resume, and retry operations through Electron IPC and `window.yihuanApi`
- Add a `TaskHistory` page and task detail drawer in React
- Add a `resume` switch to the crawl task page

## Impact

- New Python task storage and recovery helpers
- New Electron main IPC and task service
- New shared task data types
- New React task history route and task detail UI
- Existing single/all crawl flows remain supported
