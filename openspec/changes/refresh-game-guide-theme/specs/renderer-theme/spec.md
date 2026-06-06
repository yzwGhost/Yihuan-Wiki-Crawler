## ADDED Requirements

### Requirement: Game-guide visual identity

The renderer SHALL present a cohesive visual style that feels closer to a game guide or character archive than a generic admin panel.

#### Scenario: Open the desktop app

- **WHEN** the user launches the app
- **THEN** the shell uses a distinctive game-guide-inspired theme
- **AND** the navigation, cards, tables, and drawers share a cohesive visual language

### Requirement: Readable localized labels

Visible renderer labels SHALL remain readable after the visual refresh.

#### Scenario: View crawler and character pages

- **WHEN** the user opens the task page, character list, or detail drawer
- **THEN** visible Chinese labels appear correctly
- **AND** no garbled placeholder text is shown in normal page flow
