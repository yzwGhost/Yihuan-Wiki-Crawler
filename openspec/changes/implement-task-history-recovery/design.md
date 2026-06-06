## Overview

This change introduces file-based task tracking and recovery without adding a database. Python remains the source of truth for crawl execution state and persists task state into `data/tasks/tasks.json`. Electron reads the resulting JSON and exposes task views and recovery actions to the renderer.

## Data Model

Tasks are stored as a JSON array in `data/tasks/tasks.json`. Each task includes:

- `task_id`
- `mode`
- `status`
- `total`
- `success_count`
- `failed_count`
- `started_at`
- `finished_at`
- `success_urls`
- `failed_urls`
- `failed_images`
- `log_path`

`failed_images` stores `character_name`, `url`, and `error`. Retry logic reconstructs the referer and local character JSON context from the saved character data.

## Python Responsibilities

- Create or reuse task records
- Persist task updates after every meaningful crawl event
- Append emitted JSON log lines to a per-task log file
- Resume the latest unfinished batch task when `--resume true`
- Retry failed characters from a specific task with `--retry-failed-task`
- Retry failed images from a specific task with `--retry-failed-images`

## Electron Responsibilities

- Coordinate normal crawl start/stop as before
- Add dedicated IPC handlers for task list, detail, resume, failed-character retry, and failed-image retry
- Read task data through a task service
- Continue streaming Python JSON logs to the renderer unchanged

## Renderer Responsibilities

- Add a `TaskHistory` page
- Add a task detail drawer
- Show task summaries and retry/resume actions
- Pass `resume` in normal crawl start options

## Safety

- No database is introduced
- No concurrency is added
- Existing Electron security settings remain unchanged
- Existing character list/detail flows are preserved
