## ADDED Requirements

### Requirement: Sequential all-character crawl

The application SHALL support discovering and crawling all candidate Yihuan character pages through the existing Electron-to-Python subprocess flow.

#### Scenario: Start all-character crawl from the desktop UI

- **WHEN** the user selects `all` mode and clicks start
- **THEN** Electron launches `python/crawler/main.py --mode all`
- **AND** passes the shared crawl options through CLI arguments
- **AND** Python discovers candidate character links before crawling

#### Scenario: Candidate links discovered successfully

- **WHEN** Python discovers one or more valid character detail URLs
- **THEN** it saves `data/characters/candidate_links.json`
- **AND** crawls each URL sequentially
- **AND** continues after an individual character failure

#### Scenario: No candidate links discovered

- **WHEN** Python discovers zero valid character links
- **THEN** it emits an error log
- **AND** the renderer informs the user

### Requirement: Batch crawl progress reporting

The desktop application SHALL show structured batch crawl progress and counters while the all-character task runs.

#### Scenario: Batch crawl in progress

- **WHEN** Python is crawling discovered characters
- **THEN** it emits structured progress, success, and failure events
- **AND** the renderer updates running state, current item, total count, success count, failed count, and logs

### Requirement: Only save valid character pages during batch crawl

The crawler SHALL avoid persisting obvious non-character pages such as announcements, guides, items, and other unrelated wiki entries as character JSON files.

#### Scenario: Candidate link points to a non-character page

- **WHEN** a discovered detail URL resolves to a page that does not match character-page heuristics
- **THEN** Python emits a structured failure event for that URL
- **AND** the task continues with the next candidate
- **AND** no character JSON file is written for the rejected page
