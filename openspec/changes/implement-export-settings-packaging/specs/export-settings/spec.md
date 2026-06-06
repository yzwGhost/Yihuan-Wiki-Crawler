## ADDED Requirements

### Requirement: Export character data from the desktop app

The application SHALL export crawled character data into JSON, CSV, and Markdown files under a configurable export directory.

#### Scenario: Export all characters as JSON

- **WHEN** the user exports all characters as JSON
- **THEN** Electron reads all character JSON files except `all_characters.json` and `candidate_links.json`
- **AND** writes `all_characters_export.json` into the export directory
- **AND** preserves readable UTF-8 JSON formatting with indentation

#### Scenario: Export all characters as CSV

- **WHEN** the user exports all characters as CSV
- **THEN** Electron writes `all_characters.csv` into the export directory
- **AND** includes character summary fields usable in spreadsheet tools
- **AND** writes the CSV with UTF-8 BOM so Excel can read Chinese text correctly

#### Scenario: Export one character

- **WHEN** the user exports a single character as JSON or Markdown
- **THEN** Electron writes the requested file into the export directory
- **AND** preserves the selected character's data in a human-readable format

### Requirement: Persist application settings in local JSON

The application SHALL persist crawler and export defaults in `data/settings.json`.

#### Scenario: Load settings

- **WHEN** the renderer requests application settings
- **THEN** Electron returns saved settings from `data/settings.json`
- **AND** falls back to the default settings if the file does not exist

#### Scenario: Save settings

- **WHEN** the user saves settings from the settings page
- **THEN** Electron writes the updated settings to `data/settings.json`
- **AND** later app launches return the saved values

#### Scenario: Reset settings

- **WHEN** the user resets settings
- **THEN** Electron restores the documented default settings
- **AND** persists the reset values to `data/settings.json`

### Requirement: Use settings defaults across renderer workflows

The renderer SHALL use shared settings defaults without forcing temporary crawl form edits to overwrite global settings.

#### Scenario: Open crawl task page

- **WHEN** the user opens the crawl task page
- **THEN** the form initializes from persisted settings defaults
- **AND** temporary edits only affect the current run unless the user explicitly saves settings

#### Scenario: Open export page

- **WHEN** the user opens the export page
- **THEN** the page shows the current export directory from settings
- **AND** lets the user export data or choose a different export directory through Electron

### Requirement: Document local setup and packaging hygiene

The project SHALL include startup documentation and ignore generated output before packaging.

#### Scenario: Read project setup instructions

- **WHEN** a developer opens the README
- **THEN** they can find app startup steps, Python environment setup, Playwright Chromium installation, and troubleshooting notes

#### Scenario: Review ignored files

- **WHEN** the repository is checked for generated files
- **THEN** `.gitignore` excludes node, build, crawler output, export output, and Python virtualenv artifacts
