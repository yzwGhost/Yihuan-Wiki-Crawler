## ADDED Requirements

### Requirement: Confirm settings actions with explicit feedback

The renderer SHALL give users clear confirmation when application settings are saved or reset.

#### Scenario: Save settings successfully

- **WHEN** the user saves settings from the settings page
- **THEN** the app shows a success dialog confirming that the values were persisted
- **AND** the dialog makes it clear that the updated settings will be used by later workflows

#### Scenario: Fail to save settings

- **WHEN** saving settings fails
- **THEN** the app shows an error dialog with a readable failure message

#### Scenario: Reset settings

- **WHEN** the user restores default settings
- **THEN** the app asks for confirmation before overwriting saved values
- **AND** shows a success or failure dialog after the reset completes

### Requirement: Match the desktop window chrome to the app theme

The desktop shell SHALL use a window toolbar that visually matches the in-app renderer theme.

#### Scenario: Open the app window

- **WHEN** the user launches the desktop app
- **THEN** the default system title bar is replaced with a themed custom toolbar
- **AND** the toolbar provides minimize, maximize/restore, and close actions
- **AND** the toolbar stays visually consistent with the renderer's dark-and-accent design language
