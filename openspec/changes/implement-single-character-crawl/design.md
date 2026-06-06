# Design: implement single character crawl

## Architecture

The current architecture remains unchanged:

- React collects user input and shows logs.
- Electron main validates inputs, launches Python, and forwards logs.
- Python performs crawling, parsing, downloading, and storage.

## Python modules

- `main.py`: CLI entry, argument parsing, logging, and orchestration
- `spider.py`: Playwright browsing, auto-scroll, interactive clicks, image extraction
- `parser.py`: text cleanup, title extraction, section extraction, junk filtering
- `downloader.py`: HTTP image fetch with crawler headers
- `storage.py`: filesystem-safe JSON and image persistence

## Error handling

- `single` mode requires a URL
- `all` mode is explicitly rejected for now
- Image download failures are recorded in `download_failed`
- Crawl failures emit structured error logs and preserve partial diagnostics
