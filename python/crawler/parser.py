from __future__ import annotations

import re
from typing import Iterable

from bs4 import BeautifulSoup, Tag

KEEP_SECTIONS = [
    "\u57fa\u7840\u4fe1\u606f",
    "\u7a81\u7834",
    "\u5f02\u80fd",
    "\u89c9\u9192",
    "\u6863\u6848\u8be6\u60c5",
    "\u9082\u9005",
    "\u8bed\u97f3\u8bb0\u5f55",
    "\u559c\u7231\u793c\u7269",
    "\u597d\u611f\u7b49\u7ea7\u5956\u52b1",
    "\u90fd\u5e02\u7279\u6280",
    "\u5171\u9e23\u6548\u679c",
]

STOP_SECTIONS = [
    "\u89d2\u8272\u653b\u7565",
    "\u89d2\u8272\u76f8\u5173\u5f71\u97f3",
    "\u8bc4\u8bba",
    "\u6765\u81eawiki",
    "history record",
    "\u6295\u8bc9\u6216\u5efa\u8bae",
    "\u4e3e\u62a5",
    "\u66f4\u6362\u7ed1\u5b9a\u6587\u7ae0",
    "There is no more data available",
]

JUNK_KEYWORDS = [
    "\u767b\u5f55",
    "\u6ce8\u518c",
    "\u53d1\u5e16",
    "\u8bc4\u8bba\u6d88\u606f",
    "\u7cfb\u7edf\u6d88\u606f",
    "\u5206\u4eab",
    "\u8d5e\u540c",
    "\u5173\u6ce8",
    "\u539f\u521b",
    "\u8eab\u4efd\u8ba4\u8bc1",
    "\u6295\u8bc9\u6216\u5efa\u8bae",
    "\u4e3e\u62a5",
    "\u5e7f\u544a",
    "\u653b\u7565",
]

NON_CHARACTER_TITLE_KEYWORDS = [
    "gamekee",
    "wiki",
    "\u653b\u7565",
    "\u516c\u544a",
    "\u7ef4\u62a4",
    "\u8865\u507f",
    "\u66f4\u65b0",
    "\u65e5\u5fd7",
    "\u9053\u5177",
    "\u6559\u7a0b",
    "\u4efb\u52a1",
    "\u6d3b\u52a8",
    "\u7535\u8bdd\u4ead",
    "\u5531\u7247",
    "\u5f02\u8c61\u59d4\u6258",
]

CHARACTER_BODY_MARKERS = [
    "\u7a00\u6709\u5ea6",
    "cv",
    "\u5f02\u80fd",
    "\u89c9\u9192",
    "\u6863\u6848\u7b80\u4ecb",
    "\u5f02\u80fd\u540d",
    "\u5b9e\u88c5\u65e5\u671f",
    "\u89d2\u8272\u5b9a\u4f4d",
    "\u9002\u914d\u5f26\u76d8\u7c7b\u578b",
    "\u90fd\u5e02\u7279\u6280",
    "\u5171\u9e23\u6548\u679c",
]


def clean_text(value: str) -> str:
    text = value.replace("\xa0", " ").replace("\u3000", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def text_to_lines(value: str | Iterable[str]) -> list[str]:
    candidates = re.split(r"[\r\n]+", value) if isinstance(value, str) else list(value)
    lines: list[str] = []
    seen: set[str] = set()

    for candidate in candidates:
        line = clean_text(candidate)
        if not line or is_junk_line(line) or line in seen:
            continue
        seen.add(line)
        lines.append(line)

    return lines


def extract_title(soup: BeautifulSoup, fallback_url: str) -> str:
    meta = soup.find("meta", attrs={"property": "og:title"})
    if meta and meta.get("content"):
        return clean_text(str(meta["content"]).split("-")[0])

    for selector in ("h1", "title"):
        node = soup.find(selector)
        if node:
            text = clean_text(node.get_text(" ", strip=True))
            if text:
                return text.split("-")[0].strip()

    return fallback_url.rstrip("/").split("/")[-1] or "\u672a\u77e5\u89d2\u8272"


def extract_sections_from_text(
    html: str,
    allow_fallback: bool = True,
) -> list[dict[str, list[str] | str]]:
    soup = BeautifulSoup(html, "html.parser")
    for node in soup(["script", "style", "noscript", "template"]):
        node.decompose()

    sections: list[dict[str, list[str] | str]] = []
    seen_titles: set[str] = set()

    for heading in soup.find_all(["h1", "h2", "h3", "h4", "strong", "b"]):
        title = clean_text(heading.get_text(" ", strip=True))
        if not title:
            continue

        if title in STOP_SECTIONS:
            break

        matched_title = next((item for item in KEEP_SECTIONS if item in title), None)
        if not matched_title or matched_title in seen_titles:
            continue

        lines = collect_section_lines(heading)
        if not lines:
            continue

        seen_titles.add(matched_title)
        sections.append({"title": matched_title, "lines": lines})

    if sections:
        return sections

    if not allow_fallback:
        return []

    body_text = soup.get_text("\n", strip=True)
    fallback_lines = text_to_lines(body_text)[:80]
    if not fallback_lines:
        fallback_lines = ["\u672a\u63d0\u53d6\u5230\u53ef\u7528\u6587\u672c\u5185\u5bb9"]
    return [{"title": "\u57fa\u7840\u4fe1\u606f", "lines": fallback_lines}]


def collect_section_lines(heading: Tag) -> list[str]:
    lines: list[str] = []
    limit = 60

    for sibling in heading.next_siblings:
        if isinstance(sibling, Tag) and sibling.name in {"h1", "h2", "h3", "h4", "strong", "b"}:
            break

        if isinstance(sibling, Tag):
            lines.extend(text_to_lines(sibling.get_text("\n", strip=True)))
        else:
            lines.extend(text_to_lines(str(sibling)))

        if len(lines) >= limit:
            break

    return lines[:limit]


def is_junk_line(line: str) -> bool:
    cleaned = clean_text(line)
    return not cleaned or any(keyword in cleaned for keyword in JUNK_KEYWORDS)


def is_probable_character_page(
    title: str,
    sections: list[dict[str, list[str] | str]],
    body_text: str,
) -> bool:
    normalized_title = clean_text(title).lower()
    if not normalized_title:
        return False

    if any(keyword in normalized_title for keyword in NON_CHARACTER_TITLE_KEYWORDS):
        return False

    normalized_body = clean_text(body_text)
    section_titles = {
        clean_text(str(section.get("title", "")))
        for section in sections
        if clean_text(str(section.get("title", "")))
    }
    keep_hits = len(section_titles.intersection(KEEP_SECTIONS))
    marker_hits = sum(1 for marker in CHARACTER_BODY_MARKERS if marker in normalized_body)

    if keep_hits >= 2:
        return True

    return keep_hits >= 1 and marker_hits >= 3
