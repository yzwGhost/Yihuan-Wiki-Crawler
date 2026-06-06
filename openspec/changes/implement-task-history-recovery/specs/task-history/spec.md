## ADDED Requirements

### Requirement: JSON task history persistence

The application SHALL store crawl task history in `data/tasks/tasks.json` without introducing a database.

#### Scenario: Start a crawl task

- **WHEN** a single or all-character crawl starts
- **THEN** Python creates a task record
- **AND** marks it as `running`

#### Scenario: Update a running task

- **WHEN** discovery, character results, image failures, completion, stop, or abnormal exit occurs
- **THEN** Python updates the task record in `data/tasks/tasks.json`

### Requirement: Resume interrupted all-character crawl

The application SHALL support resuming the most recent unfinished all-character task.

#### Scenario: Resume enabled with unfinished task

- **WHEN** the user starts an `all` crawl with `resume=true`
- **THEN** Python loads the most recent unfinished all-character task
- **AND** skips URLs that already succeeded
- **AND** retries URLs that were not completed or previously failed

#### Scenario: Resume enabled without unfinished task

- **WHEN** no resumable all-character task exists
- **THEN** Python starts a new task normally

### Requirement: Retry failed characters and images

The application SHALL support retrying failed character crawls and failed image downloads for a specific task.

#### Scenario: Retry failed characters

- **WHEN** the user retries failed characters for a task
- **THEN** Python reprocesses the task's `failed_urls`
- **AND** removes successful retries from `failed_urls`
- **AND** appends them to `success_urls`

#### Scenario: Retry failed images

- **WHEN** the user retries failed images for a task
- **THEN** Python re-downloads the task's `failed_images`
- **AND** removes successful retries from `failed_images`

### Requirement: Task history viewing

The desktop application SHALL show persisted task history and task detail data in the renderer.

#### Scenario: Open task history page

- **WHEN** the user opens the task history page
- **THEN** Electron returns task summaries from `data/tasks/tasks.json`

#### Scenario: Open task detail

- **WHEN** the user selects one task
- **THEN** Electron returns the full task payload
- **AND** the renderer shows metadata, success URLs, failed URLs, failed images, and raw JSON
