from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag
from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

from downloader import fetch_image
from parser import (
    extract_sections_from_text,
    extract_title,
    is_probable_character_page,
    text_to_lines,
)
from storage import save_character_json, save_image_asset

DISCOVER_URLS = [
    "https://www.gamekee.com/yh/",
    "https://www.gamekee.com/yh/?utm_source=chatgpt.com",
]

DETAIL_URL_PATTERN = re.compile(r"/yh/\d+\.html(?:\?.*)?$")

EXCLUDED_DISCOVER_PATHS = (
    "/yh/list",
    "/yh/search",
    "/yh/post",
    "/yh/bbs",
    "/yh/news",
)

EXCLUDED_DISCOVER_TEXT_KEYWORDS = (
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
    "\u804a\u5929",
    "\u793e\u533a",
    "\u8bc4\u8bba",
    "\u7f16\u8f91",
    "\u5f02\u8c61\u59d4\u6258",
    "\u7535\u8bdd\u4ead",
    "\u5531\u7247",
)

STRICT_CLICK_TEXTS = [
    "\u70b9\u51fb\u67e5\u770b",
    "\u67e5\u770b\u5347\u7ea7\u6548\u679c",
    "\u9762\u677f\u6570\u636e",
    "\u89d2\u8272\u7acb\u7ed8",
    "Lv.1",
    "Lv.2",
    "Lv.3",
    "Lv.4",
    "Lv.5",
    "Lv.6",
    "1\u7ea7\u89c9\u9192",
    "2\u7ea7\u89c9\u9192",
    "3\u7ea7\u89c9\u9192",
    "4\u7ea7\u89c9\u9192",
    "5\u7ea7\u89c9\u9192",
    "6\u7ea7\u89c9\u9192",
]

EXCLUDED_IMAGE_KEYWORDS = (
    "avatar",
    "icon",
    "logo",
    "emoji",
    "emot",
    "banner",
    "advert",
    "ad-",
    "/ad/",
    "comment",
    "reply",
    "user",
    "profile",
    "nav",
    "navbar",
    "footer",
    "header",
    "sprite",
    "thumb",
    "thumbnail",
    "share",
    "qr",
    "qrcode",
    "favicon",
    "badge",
)

EXCLUDED_CONTAINER_HINTS = (
    "header",
    "footer",
    "nav",
    "menu",
    "toolbar",
    "comment",
    "reply",
    "avatar",
    "author",
    "user",
    "login",
    "register",
    "share",
    "recommend",
    "related",
    "banner",
    "ad",
)

CONTENT_CONTAINER_HINTS = (
    "main",
    "content",
    "article",
    "wiki",
    "detail",
    "char",
    "role",
    "skill",
    "panel",
    "dialog",
    "modal",
    "popup",
)


@dataclass
class CrawlOptions:
    output_dir: str
    download_images: bool
    headless: bool
    max_click: int
    page_wait: int = 1500
    click_wait: int = 800


DEFAULT_NAVIGATION_TIMEOUT_MS = 60000
DEFAULT_ACTION_TIMEOUT_MS = 10000


def discover_character_links(
    options: CrawlOptions,
    emit: Callable[[str, str], None] | None = None,
) -> list[str]:
    discovered: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=options.headless)
        context = create_browser_context(browser, options)
        page = context.new_page()
        try:
            for discover_url in DISCOVER_URLS:
                if emit:
                    emit("log", f"\u6b63\u5728\u626b\u63cf\u53d1\u73b0\u9875\uff1a{discover_url}")
                try:
                    page.goto(discover_url, wait_until="domcontentloaded", timeout=60000)
                    page.wait_for_timeout(options.page_wait)
                    auto_scroll(page)
                    html = page.content()
                    discovered.extend(extract_candidate_links(page.url, html))
                except Exception as error:  # noqa: BLE001
                    if emit:
                        emit("log", f"\u53d1\u73b0\u9875\u626b\u63cf\u5931\u8d25\uff1a{discover_url} - {error}")
                    continue
        finally:
            context.close()
            browser.close()

    return dedupe_urls(discovered)


def crawl_single_character(
    url: str,
    options: CrawlOptions,
    emit: Callable[[str, str], None],
    on_image_failed: Callable[[str, str, str], None] | None = None,
) -> dict:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=options.headless)
        context = create_browser_context(browser, options)
        try:
            return crawl_single_character_in_context(
                context=context,
                url=url,
                options=options,
                emit=emit,
                on_image_failed=on_image_failed,
            )
        finally:
            context.close()
            browser.close()


def crawl_single_character_in_browser(
    browser: Browser,
    url: str,
    options: CrawlOptions,
    emit: Callable[[str, str], None],
    on_image_failed: Callable[[str, str, str], None] | None = None,
) -> dict:
    context = create_browser_context(browser, options)
    try:
        return crawl_single_character_in_context(
            context=context,
            url=url,
            options=options,
            emit=emit,
            on_image_failed=on_image_failed,
        )
    finally:
        context.close()


def create_browser_context(browser: Browser, options: CrawlOptions) -> BrowserContext:
    context = browser.new_context()
    context.set_default_timeout(DEFAULT_ACTION_TIMEOUT_MS)
    context.set_default_navigation_timeout(max(DEFAULT_NAVIGATION_TIMEOUT_MS, options.page_wait + 15000))
    return context


def crawl_single_character_in_context(
    context: BrowserContext,
    url: str,
    options: CrawlOptions,
    emit: Callable[[str, str], None],
    on_image_failed: Callable[[str, str, str], None] | None = None,
) -> dict:
    output_dir = Path(options.output_dir).resolve()
    emit("log", "\u5f00\u59cb\u722c\u53d6\u5355\u89d2\u8272")
    emit("log", f"\u6b63\u5728\u6253\u5f00\u9875\u9762\uff1a{url}")

    page = context.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=DEFAULT_NAVIGATION_TIMEOUT_MS)
        page.wait_for_timeout(options.page_wait)
        auto_scroll(page)

        html = page.content()
        soup = BeautifulSoup(html, "html.parser")
        name = extract_title(soup, url)
        default_sections = extract_sections_from_text(html, allow_fallback=False)
        body_text = soup.get_text("\n", strip=True)

        if not is_probable_character_page(name, default_sections, body_text):
            raise ValueError(f"Rejected non-character page: {name or page.url}")

        emit("progress", f"\u6b63\u5728\u5904\u7406\uff1a{name}")

        base_images = extract_image_urls(page)
        interactive_sections = collect_interactive_sections(page, options, emit)
        interactive_images = [
            image_url
            for section in interactive_sections
            for image_url in section.get("images", [])
        ]
        all_image_urls = dedupe_urls(base_images + interactive_images)
        emit("log", f"\u5df2\u7b5b\u9009\u51fa {len(all_image_urls)} \u5f20\u89d2\u8272\u76f8\u5173\u56fe\u7247")

        payload = {
            "name": name,
            "url": page.url,
            "default_sections": default_sections,
            "interactive_sections": interactive_sections,
            "images": {
                "urls": all_image_urls,
                "downloaded": [],
                "download_failed": [],
            },
        }

        if options.download_images:
            for index, image_url in enumerate(all_image_urls, start=1):
                try:
                    downloaded = fetch_image(image_url, referer=page.url)
                    saved = save_image_asset(output_dir, name, index, downloaded)
                    payload["images"]["downloaded"].append(saved)
                except Exception as error:  # noqa: BLE001
                    payload["images"]["download_failed"].append({"url": image_url, "error": str(error)})
                    if on_image_failed:
                        on_image_failed(name, image_url, str(error))

        save_character_json(output_dir, payload)
        return payload
    finally:
        page.close()


def extract_candidate_links(base_url: str, html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []

    for anchor in soup.find_all("a", href=True):
        href = str(anchor.get("href", "")).strip()
        if not href:
            continue
        absolute_url = urljoin(base_url, href)
        parsed = urlparse(absolute_url)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        if any(path in parsed.path for path in EXCLUDED_DISCOVER_PATHS):
            continue

        if not DETAIL_URL_PATTERN.search(parsed.path):
            continue

        if not looks_like_character_link(anchor):
            continue

        links.append(normalized)

    return dedupe_urls(links)


def looks_like_character_link(anchor: Tag) -> bool:
    anchor_text = " ".join(
        filter(
            None,
            [
                anchor.get_text(" ", strip=True),
                str(anchor.get("title", "")).strip(),
                str(anchor.get("aria-label", "")).strip(),
            ],
        )
    )
    image_alt_text = " ".join(
        img.get("alt", "").strip()
        for img in anchor.find_all("img")
        if img.get("alt")
    )
    parent_text = ""
    if anchor.parent is not None:
        parent_text = anchor.parent.get_text(" ", strip=True)[:120]

    combined_text = " ".join(filter(None, [anchor_text, image_alt_text, parent_text])).lower()
    if not combined_text:
        return False

    if any(keyword in combined_text for keyword in EXCLUDED_DISCOVER_TEXT_KEYWORDS):
        return False

    compact_text = re.sub(r"\s+", "", combined_text)
    if len(compact_text) > 32:
        return False

    return True


def auto_scroll(page: Page) -> None:
    previous_height = -1
    stable_rounds = 0

    while stable_rounds < 3:
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(700)
        current_height = page.evaluate("document.body.scrollHeight")
        if current_height == previous_height:
            stable_rounds += 1
        else:
            previous_height = current_height
            stable_rounds = 0

    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(200)


def extract_image_urls(page: Page, root_selector: str | None = None) -> list[str]:
    base_url = page.url
    candidates = collect_image_candidates(page, root_selector)
    urls = [candidate["url"] for candidate in candidates if is_character_related_image(candidate, base_url)]
    return dedupe_urls(urls)


def split_image_values(base_url: str, value: str) -> list[str]:
    urls: list[str] = []
    for part in value.split(","):
        cleaned = part.strip().split(" ")[0].strip("\"' ")
        if cleaned:
            urls.append(urljoin(base_url, cleaned))
    return urls


def collect_image_candidates(page: Page, root_selector: str | None = None) -> list[dict]:
    base_url = page.url
    script = """
      (selector) => {
        const root = selector ? document.querySelector(selector) : document;
        if (!root) return [];

        const nodes = Array.from(root.querySelectorAll('img, source, [style*="background-image"]'));
        const results = [];

        for (const node of nodes) {
          const element = node;
          const tagName = (element.tagName || '').toLowerCase();
          const rect = typeof element.getBoundingClientRect === 'function'
            ? element.getBoundingClientRect()
            : { width: 0, height: 0 };
          const parentChain = [];
          let current = element.parentElement;
          let depth = 0;

          while (current && depth < 5) {
            const descriptor = [current.tagName || '', current.id || '', current.className || '']
              .filter(Boolean)
              .join(' ')
              .trim();
            if (descriptor) {
              parentChain.push(descriptor);
            }
            current = current.parentElement;
            depth += 1;
          }

          const pushCandidate = (rawUrl) => {
            if (!rawUrl) return;
            const trimmed = String(rawUrl).trim();
            if (!trimmed) return;

            results.push({
              url: trimmed,
              tagName,
              alt: element.getAttribute('alt') || '',
              title: element.getAttribute('title') || '',
              className: typeof element.className === 'string' ? element.className : '',
              id: element.id || '',
              width: Math.round(rect.width || element.clientWidth || element.naturalWidth || 0),
              height: Math.round(rect.height || element.clientHeight || element.naturalHeight || 0),
              naturalWidth: Number(element.naturalWidth || 0),
              naturalHeight: Number(element.naturalHeight || 0),
              parentChain,
              ariaHidden: element.getAttribute('aria-hidden') || '',
              loading: element.getAttribute('loading') || '',
            });
          };

          if (tagName === 'img' || tagName === 'source') {
            for (const attr of ['src', 'data-src', 'data-original', 'data-lazy-src', 'data-url', 'srcset']) {
              const rawValue = element.getAttribute(attr);
              if (!rawValue) continue;

              if (attr === 'srcset') {
                for (const item of rawValue.split(',')) {
                  const firstPart = item.trim().split(/\\s+/)[0];
                  pushCandidate(firstPart);
                }
              } else {
                pushCandidate(rawValue);
              }
            }
          }

          const inlineStyle = element.getAttribute('style') || '';
          const styleMatches = inlineStyle.match(/background-image\\s*:\\s*url\\(([^)]+)\\)/ig) || [];
          for (const match of styleMatches) {
            const urlMatch = match.match(/url\\(([^)]+)\\)/i);
            if (urlMatch && urlMatch[1]) {
              pushCandidate(urlMatch[1].replace(/^['"]|['"]$/g, '').trim());
            }
          }
        }

        return results;
      }
    """

    raw_candidates = page.evaluate(script, root_selector)
    cleaned_candidates: list[dict] = []
    seen: set[tuple[str, int, int]] = set()

    for candidate in raw_candidates:
        raw_url = str(candidate.get("url", "")).strip()
        if not raw_url:
            continue
        resolved = urljoin(base_url, raw_url)
        key = (
            resolved,
            int(candidate.get("naturalWidth", 0) or 0),
            int(candidate.get("naturalHeight", 0) or 0),
        )
        if key in seen:
            continue
        seen.add(key)
        candidate["url"] = resolved
        cleaned_candidates.append(candidate)

    return cleaned_candidates


def is_character_related_image(candidate: dict, base_url: str) -> bool:
    url = str(candidate.get("url", "")).strip()
    if not url:
        return False

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False

    combined_text = " ".join(
        [
            url.lower(),
            str(candidate.get("alt", "")).lower(),
            str(candidate.get("title", "")).lower(),
            str(candidate.get("className", "")).lower(),
            str(candidate.get("id", "")).lower(),
            " ".join(str(item).lower() for item in candidate.get("parentChain", [])),
        ]
    )

    if any(keyword in combined_text for keyword in EXCLUDED_IMAGE_KEYWORDS):
        return False

    if any(hint in combined_text for hint in EXCLUDED_CONTAINER_HINTS) and not any(
        hint in combined_text for hint in CONTENT_CONTAINER_HINTS
    ):
        return False

    width = max(int(candidate.get("width", 0) or 0), int(candidate.get("naturalWidth", 0) or 0))
    height = max(int(candidate.get("height", 0) or 0), int(candidate.get("naturalHeight", 0) or 0))
    if width and height and max(width, height) < 120:
        return False

    if width and height and width < 80 and height < 80:
        return False

    if str(candidate.get("ariaHidden", "")).lower() == "true" and max(width, height) < 240:
        return False

    current_host = urlparse(base_url).netloc
    image_host = parsed.netloc
    if current_host and image_host and current_host != image_host:
        if not any(host in image_host for host in ("gamekee", "cdn", "image", "img")):
            return False

    return True


def collect_interactive_sections(
    page: Page,
    options: CrawlOptions,
    emit: Callable[[str, str], None],
) -> list[dict]:
    sections: list[dict] = []
    click_count = 0

    for button_text in STRICT_CLICK_TEXTS:
        if click_count >= options.max_click:
            break

        locator = page.get_by_text(button_text, exact=False)
        count = locator.count()
        for index in range(count):
            if click_count >= options.max_click:
                break

            target = locator.nth(index)
            try:
                if not target.is_visible():
                    continue

                target.scroll_into_view_if_needed()
                target.click(timeout=3000)
                page.wait_for_timeout(options.click_wait)

                snapshot = snapshot_interactive_content(page, button_text)
                if snapshot["lines"] or snapshot["images"]:
                    sections.append(snapshot)
                    emit("log", f"\u5df2\u63d0\u53d6\u4ea4\u4e92\u5185\u5bb9\uff1a{button_text}")

                close_overlays(page)
                click_count += 1
            except Exception:  # noqa: BLE001
                close_overlays(page)
                continue

    return sections


def snapshot_interactive_content(page: Page, button_text: str) -> dict:
    texts: list[str] = []
    images: list[str] = []
    selectors = [
        "[role='dialog']",
        ".modal",
        ".popup",
        ".dialog",
        ".el-dialog",
        ".ant-modal",
        ".layui-layer",
    ]

    for selector in selectors:
        locator = page.locator(selector)
        count = min(locator.count(), 3)
        for index in range(count):
            current = locator.nth(index)
            if not current.is_visible():
                continue
            texts.append(current.inner_text())
            images.extend(extract_image_urls(page, selector))

    if not texts:
        html = page.content()
        texts = ["\n".join(section["lines"]) for section in extract_sections_from_text(html)[:2]]
        images.extend(extract_image_urls(page))

    return {
        "title": button_text,
        "type": "overlay",
        "button_text": button_text,
        "lines": text_to_lines("\n".join(texts))[:120],
        "images": dedupe_urls(images),
    }


def close_overlays(page: Page) -> None:
    try:
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
    except Exception:  # noqa: BLE001
        pass

    for selector in (
        "[aria-label='Close']",
        ".ant-modal-close",
        ".el-dialog__close",
        ".close",
        ".popup-close",
    ):
        locator = page.locator(selector)
        count = min(locator.count(), 2)
        for index in range(count):
            try:
                button = locator.nth(index)
                if button.is_visible():
                    button.click(timeout=1000)
                    page.wait_for_timeout(200)
            except Exception:  # noqa: BLE001
                continue


def dedupe_urls(urls: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        result.append(url)
    return result
