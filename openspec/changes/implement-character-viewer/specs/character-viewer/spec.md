## ADDED Requirements

### Requirement: Character summary listing

The desktop application SHALL list saved character JSON files from the local `data/characters` directory.

#### Scenario: Characters directory exists

- **WHEN** valid character JSON files exist under `data/characters`
- **THEN** Electron returns one summary row per file
- **AND** it excludes `all_characters.json` and `candidate_links.json`

#### Scenario: Characters directory is missing

- **WHEN** `data/characters` does not exist
- **THEN** Electron returns an empty list
- **AND** the renderer remains usable

#### Scenario: One character file is invalid

- **WHEN** one character JSON file cannot be parsed
- **THEN** Electron logs the parse error
- **AND** skips only the invalid file

### Requirement: Character detail viewing

The desktop application SHALL show full saved character details in a drawer.

#### Scenario: Open one character detail

- **WHEN** the user selects `查看详情` for a summary row
- **THEN** Electron returns the full character JSON document
- **AND** the renderer shows default sections, interactive sections, images, and raw JSON

### Requirement: Character list search

The desktop application SHALL let users quickly filter the character summary table by character name or page URL.

#### Scenario: Search by keyword

- **WHEN** the user enters a keyword in the character list search box
- **THEN** the renderer filters the table rows locally
- **AND** matches against both the character name and URL

### Requirement: Local output opening

The desktop application SHALL let users open the saved JSON file and image directory from the character list.

#### Scenario: Open JSON or image folder

- **WHEN** the user clicks `打开 JSON 文件` or `打开图片目录`
- **THEN** Electron opens the requested local path through a dedicated IPC channel
