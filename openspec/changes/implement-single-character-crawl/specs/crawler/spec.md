## ADDED Requirements

### Requirement: Single character crawl

The application SHALL support crawling a single GameKee Yihuan character detail page through the existing Electron-to-Python subprocess flow.

#### Scenario: Start a single crawl from the desktop UI

- **WHEN** the user selects `single` mode
- **AND** enters a character detail URL
- **AND** clicks start
- **THEN** Electron launches `python/crawler/main.py`
- **AND** passes the selected crawl options through CLI arguments
- **AND** forwards Python structured logs to the renderer in real time

#### Scenario: Missing URL in single mode

- **WHEN** the user starts a crawl in `single` mode without a URL
- **THEN** Electron rejects the request before spawning Python

### Requirement: Single character JSON output

The Python crawler SHALL save one character JSON document with default sections, interactive sections, and image download results.

#### Scenario: Successful single crawl

- **WHEN** Python successfully crawls one detail page
- **THEN** it saves `data/characters/<character-name>.json`
- **AND** the JSON contains `name`, `url`, `default_sections`, `interactive_sections`, and `images`

### Requirement: Character-related image filtering

The Python crawler SHALL prefer images that belong to the character detail content and avoid downloading obvious site chrome, comment, avatar, ad, and icon assets.

#### Scenario: Filter page-level image candidates

- **WHEN** Python extracts images from a character detail page
- **THEN** it keeps images that appear in the main content or interactive overlays
- **AND** it excludes obvious navigation, logo, avatar, ad, emoji, and small UI images when possible
