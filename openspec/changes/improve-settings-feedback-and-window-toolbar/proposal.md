# Proposal

## Why

The settings page currently saves and resets values without clear success or failure confirmation, which makes it hard for users to trust the action. The desktop window also still shows a default system title bar that does not match the renderer's game-guide visual language.

## What Changes

- Add explicit success and failure dialogs for saving and resetting settings.
- Restore readable Chinese copy on the settings page and shell header where the current text is garbled.
- Replace the default system title bar with a themed custom window toolbar that matches the renderer design.

## Impact

- Adds a small window-control IPC surface for minimize, maximize/restore, close, and state updates.
- Keeps Electron security boundaries intact through the preload bridge.
- Does not change crawler, export, or storage behavior.
