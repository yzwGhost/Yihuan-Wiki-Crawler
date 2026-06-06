from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from urllib.parse import urlparse

import requests

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)


@dataclass
class DownloadedImageContent:
    url: str
    content: bytes
    content_type: str
    extension: str


def fetch_image(url: str, referer: str, timeout: int = 30) -> DownloadedImageContent:
    headers = {
        "Referer": referer,
        "Origin": "https://www.gamekee.com",
        "User-Agent": USER_AGENT,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()

    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
    if not content_type.startswith("image/"):
        raise ValueError(f"Non-image content-type: {content_type or 'unknown'}")

    if not response.content:
        raise ValueError("Empty response body")

    return DownloadedImageContent(
        url=url,
        content=response.content,
        content_type=content_type,
        extension=guess_extension(url, content_type),
    )


def guess_extension(url: str, content_type: str) -> str:
    guessed = mimetypes.guess_extension(content_type) or ""
    if guessed:
        return guessed

    path = urlparse(url).path
    file_name = path.rsplit("/", 1)[-1]
    if "." in file_name:
        return "." + file_name.rsplit(".", 1)[-1].lower()
    return ".img"
