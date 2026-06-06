# Proposal: implement single character crawl

## Summary

Implement Stage 3 single-character crawling for the desktop app while preserving the current Electron + React + Python subprocess architecture.

## Scope

- Keep the existing secure Electron IPC bridge and Python child process model.
- Extend the crawl task UI to submit real single-character crawl parameters.
- Validate `single` mode input in Electron main before launching Python.
- Replace the Python mock loop with a real Playwright-based single page crawl flow.
- Add Python modules for spidering, parsing, downloading, and storage.
- Save one character JSON file and optional images under `data/`.

## Out of scope

- Full `all` mode crawling
- FastAPI or any local HTTP server
- Broader data viewer or export enhancements

## Acceptance

- The renderer can submit a `single` crawl with URL and options.
- Electron launches `python/crawler/main.py` with the expected CLI arguments.
- Python emits structured JSON line logs during the crawl.
- A single character JSON file is saved to `data/characters/`.
- Optional images are saved to `data/images/<character-name>/`.
