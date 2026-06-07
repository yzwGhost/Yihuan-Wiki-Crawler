## ADDED Requirements

### Requirement: Dedicated image manager page

The desktop application SHALL provide a dedicated `图片资源` page for browsing locally saved character images.

#### Scenario: Open the image manager page

- **WHEN** the user opens `图片资源` from the navigation menu
- **THEN** the renderer shows an image-focused page instead of a placeholder
- **AND** the page loads from the existing saved character data under `data/characters`

### Requirement: Image-oriented summary and filtering

The image manager page SHALL help users quickly narrow image results by character and download status.

#### Scenario: View summary metrics

- **WHEN** the page loads character image data
- **THEN** it shows summary metrics including total characters with image data, downloaded image count, and failed image count

#### Scenario: Filter image results

- **WHEN** the user enters a character keyword or changes the status filter
- **THEN** the page filters image groups locally
- **AND** supports at least `全部`, `有已下载图片`, and `有失败记录`

### Requirement: Group images by character

The image manager page SHALL present downloaded images in character-centric groups.

#### Scenario: Browse downloaded images

- **WHEN** a character has downloaded images
- **THEN** the page shows the character name, image counts, and preview thumbnails
- **AND** offers actions to open the character image directory and inspect the related character detail

#### Scenario: Large local dataset

- **WHEN** many character files exist
- **THEN** the page loads summary data first
- **AND** only loads full character image preview data when needed for the visible group or explicit expansion

### Requirement: Review failed image downloads

The image manager page SHALL expose failed image records in a way that supports manual follow-up.

#### Scenario: Inspect failed downloads

- **WHEN** a character has failed image downloads
- **THEN** the page shows the failed image URL and error message
- **AND** offers quick access to the related character image directory or character detail view
