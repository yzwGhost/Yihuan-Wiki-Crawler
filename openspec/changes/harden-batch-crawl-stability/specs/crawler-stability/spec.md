## ADDED Requirements

### Requirement: Stable sequential batch crawling

The crawler SHALL keep sequential all-character crawling stable across long runs without relaunching the entire browser for every character.

#### Scenario: Batch crawl opens next character page

- **WHEN** the user runs `mode=all`
- **THEN** Python reuses one Playwright browser session for the batch
- **AND** opens a fresh page for each character URL inside that shared browser

#### Scenario: Page opening is visible in logs

- **WHEN** the crawler begins processing a character URL
- **THEN** Python emits a structured log message indicating it is opening that page
- **AND** the renderer shows the updated progress message

### Requirement: Page operations respect explicit timeouts

The crawler SHALL apply explicit page timeouts so stalled navigation or page interaction fails instead of hanging indefinitely.

#### Scenario: Navigation or interaction stalls

- **WHEN** a page navigation or related interaction exceeds the configured timeout
- **THEN** the crawler fails that character cleanly
- **AND** continues the batch instead of freezing the whole task
