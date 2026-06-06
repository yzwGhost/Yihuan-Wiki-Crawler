from __future__ import annotations

import argparse
import atexit
import json
import os
import signal
import sys
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from downloader import fetch_image
from spider import (
    CrawlOptions,
    crawl_single_character,
    crawl_single_character_in_browser,
    discover_character_links,
)
from storage import (
    get_next_image_index,
    load_candidate_links_json,
    load_character_json,
    save_candidate_links_json,
    save_character_json,
    save_image_asset,
)
from tasks import TaskRepository

RUNNING = True
ACTIVE_TASK: dict[str, Any] | None = None
TASK_REPOSITORY: TaskRepository | None = None
TASK_FINALIZED = False


def on_terminate(_signum: int, _frame: object) -> None:
    global RUNNING
    RUNNING = False


signal.signal(signal.SIGTERM, on_terminate)
signal.signal(signal.SIGINT, on_terminate)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def ensure_playwright_browsers_path() -> None:
    if os.environ.get("PLAYWRIGHT_BROWSERS_PATH"):
        return

    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        return

    browsers_dir = Path(local_app_data) / "ms-playwright"
    if browsers_dir.exists():
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(browsers_dir)


ensure_playwright_browsers_path()


@dataclass
class Payload:
    type: str
    message: str
    timestamp: str
    current: int | None = None
    total: int | None = None
    success: int | None = None
    failed: int | None = None


def now() -> str:
    return datetime.now().isoformat()


def emit(payload: Payload) -> None:
    emit_json(asdict(payload))


def emit_event(event_type: str, message: str, **extra: object) -> None:
    payload = Payload(type=event_type, message=message, timestamp=now())
    for key, value in extra.items():
        setattr(payload, key, value)
    emit(payload)


def emit_json(payload: dict[str, Any]) -> None:
    line = json.dumps(payload, ensure_ascii=False)
    print(line, flush=True)
    if TASK_REPOSITORY and ACTIVE_TASK:
        TASK_REPOSITORY.append_log(ACTIVE_TASK, line)


def to_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).lower() in {"1", "true", "yes", "on"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Yihuan crawler entry")
    parser.add_argument("--mode", choices=["single", "all"])
    parser.add_argument("--output", required=True)
    parser.add_argument("--url")
    parser.add_argument("--download-images", default="true")
    parser.add_argument("--headless", default="true")
    parser.add_argument("--max-click", type=int, default=40)
    parser.add_argument("--page-wait", type=int, default=1200)
    parser.add_argument("--click-wait", type=int, default=600)
    parser.add_argument("--resume", default="false")
    parser.add_argument("--resume-task-id")
    parser.add_argument("--retry-failed-task")
    parser.add_argument("--retry-failed-images")
    parser.add_argument("--env-check", action="store_true")
    return parser.parse_args()


def build_options(args: argparse.Namespace) -> CrawlOptions:
    return CrawlOptions(
        output_dir=str(Path(args.output).resolve()),
        download_images=to_bool(args.download_images),
        headless=to_bool(args.headless),
        max_click=args.max_click,
        page_wait=args.page_wait,
        click_wait=args.click_wait,
    )


def set_active_task(task: dict[str, Any] | None) -> None:
    global ACTIVE_TASK, TASK_FINALIZED
    ACTIVE_TASK = task
    TASK_FINALIZED = False


def persist_task_update() -> None:
    if not TASK_REPOSITORY or not ACTIVE_TASK:
        return
    TASK_REPOSITORY.save_task(ACTIVE_TASK)
    emit_json(
        {
            "type": "task_updated",
            "task_id": ACTIVE_TASK["task_id"],
            "status": ACTIVE_TASK["status"],
            "success_count": ACTIVE_TASK["success_count"],
            "failed_count": ACTIVE_TASK["failed_count"],
            "timestamp": now(),
        }
    )


def create_new_task(mode: str) -> dict[str, Any]:
    if not TASK_REPOSITORY:
        raise RuntimeError("Task repository is not initialized.")
    task = TASK_REPOSITORY.create_task(mode)
    set_active_task(task)
    emit_json(
        {
            "type": "task_created",
            "task_id": task["task_id"],
            "mode": task["mode"],
            "timestamp": now(),
        }
    )
    persist_task_update()
    return task


def attach_existing_task(task: dict[str, Any]) -> dict[str, Any]:
    set_active_task(task)
    ACTIVE_TASK["status"] = "running"
    ACTIVE_TASK["finished_at"] = None
    persist_task_update()
    return ACTIVE_TASK


def set_task_total(total: int) -> None:
    if not ACTIVE_TASK:
        return
    ACTIVE_TASK["total"] = max(0, total)
    persist_task_update()


def mark_task_success(url: str) -> None:
    if not ACTIVE_TASK or not TASK_REPOSITORY:
        return
    updated = TASK_REPOSITORY.add_success_url(ACTIVE_TASK, url)
    set_active_task(updated)
    persist_task_update()


def mark_task_failed(url: str, error: str) -> None:
    if not ACTIVE_TASK or not TASK_REPOSITORY:
        return
    updated = TASK_REPOSITORY.add_failed_url(ACTIVE_TASK, url, error)
    set_active_task(updated)
    persist_task_update()


def mark_failed_image(character_name: str, url: str, error: str) -> None:
    if not ACTIVE_TASK or not TASK_REPOSITORY:
        return
    updated = TASK_REPOSITORY.add_failed_image(ACTIVE_TASK, character_name, url, error)
    set_active_task(updated)
    emit_json(
        {
            "type": "image_failed",
            "character_name": character_name,
            "url": url,
            "error": error,
            "timestamp": now(),
        }
    )
    persist_task_update()


def finalize_task(status: str) -> None:
    global TASK_FINALIZED
    if not ACTIVE_TASK or not TASK_REPOSITORY or TASK_FINALIZED:
        return
    ACTIVE_TASK["status"] = status
    ACTIVE_TASK["finished_at"] = now()
    TASK_REPOSITORY.save_task(ACTIVE_TASK)
    TASK_FINALIZED = True
    emit_json(
        {
            "type": "task_updated",
            "task_id": ACTIVE_TASK["task_id"],
            "status": ACTIVE_TASK["status"],
            "success_count": ACTIVE_TASK["success_count"],
            "failed_count": ACTIVE_TASK["failed_count"],
            "timestamp": now(),
        }
    )


def handle_exit() -> None:
    if not ACTIVE_TASK or TASK_FINALIZED:
        return
    if TASK_REPOSITORY:
        ACTIVE_TASK["status"] = "stopped" if not RUNNING else "failed"
        ACTIVE_TASK["finished_at"] = now()
        TASK_REPOSITORY.save_task(ACTIVE_TASK)


atexit.register(handle_exit)


def ensure_running() -> None:
    if not RUNNING:
        raise RuntimeError("Crawler stopped by user.")


def should_resume(args: argparse.Namespace) -> bool:
    return args.mode == "all" and to_bool(args.resume)


def discover_links_with_task(options: CrawlOptions) -> list[str]:
    ensure_running()
    emit_event("log", "\u5f00\u59cb\u53d1\u73b0\u89d2\u8272\u94fe\u63a5")
    links = discover_character_links(options, lambda event_type, message: emit_event(event_type, message))
    save_candidate_links_json(Path(options.output_dir).resolve(), links)
    emit_json(
        {
            "type": "discover_done",
            "total": len(links),
            "message": f"\u53d1\u73b0 {len(links)} \u4e2a\u5019\u9009\u89d2\u8272\u94fe\u63a5",
            "timestamp": now(),
        }
    )
    set_task_total(len(links))
    return links


def get_links_for_all_mode(args: argparse.Namespace, options: CrawlOptions) -> tuple[dict[str, Any], list[str]]:
    if should_resume(args) and TASK_REPOSITORY:
        resumable_task = (
            TASK_REPOSITORY.get_task(args.resume_task_id)
            if args.resume_task_id
            else TASK_REPOSITORY.get_latest_resumable_task()
        )
        if (
            resumable_task
            and resumable_task.get("mode") == "all"
            and resumable_task.get("status") in {"running", "failed", "stopped"}
        ):
            task = attach_existing_task(resumable_task)
            emit_event("log", f"\u7ee7\u7eed\u4efb\u52a1\uff1a{task['task_id']}")
            links = load_candidate_links_json(Path(options.output_dir).resolve())
            if not links:
                links = discover_links_with_task(options)
            success_urls = set(task.get("success_urls", []))
            pending_links = [url for url in links if url not in success_urls]
            failed_urls = [item.get("url", "") for item in task.get("failed_urls", []) if item.get("url")]
            ordered_urls: list[str] = []
            seen: set[str] = set()
            for url in pending_links + failed_urls:
                if url and url not in seen:
                    ordered_urls.append(url)
                    seen.add(url)
            return task, ordered_urls
        if args.resume_task_id:
            raise ValueError(f"Task is not resumable: {args.resume_task_id}")

    task = create_new_task("all")
    links = discover_links_with_task(options)
    return task, links


def run_single_mode(args: argparse.Namespace, options: CrawlOptions) -> int:
    create_new_task("single")
    try:
        ensure_running()
        emit_event("log", "\u5f00\u59cb\u722c\u53d6\u5355\u89d2\u8272")
        set_task_total(1)
        emit(
            Payload(
                type="progress",
                message="\u6b63\u5728\u521d\u59cb\u5316\u722c\u866b",
                timestamp=now(),
                current=1,
                total=1,
            )
        )

        result = crawl_single_character(
            args.url,
            options,
            lambda event_type, message: emit_event(event_type, message, current=1, total=1),
            on_image_failed=mark_failed_image,
        )

        mark_task_success(result["url"])
        emit_json(
            {
                "type": "character_done",
                "name": result["name"],
                "url": result["url"],
                "timestamp": now(),
            }
        )
        finalize_task("completed")
        emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=1, failed=0))
        return 0
    except Exception as error:  # noqa: BLE001
        mark_task_failed(args.url or "", str(error))
        emit_json(
            {
                "type": "character_failed",
                "url": args.url or "",
                "error": str(error),
                "timestamp": now(),
            }
        )
        finalize_task("stopped" if not RUNNING else "failed")
        emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=0, failed=1))
        return 1


def run_all_mode(args: argparse.Namespace, options: CrawlOptions) -> int:
    _task, links = get_links_for_all_mode(args, options)

    if not links:
        emit_json(
            {
                "type": "error",
                "message": "\u672a\u53d1\u73b0\u4efb\u4f55\u89d2\u8272\u94fe\u63a5",
                "timestamp": now(),
            }
        )
        finalize_task("failed")
        emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=0, failed=1))
        return 1

    total = int(ACTIVE_TASK.get("total", len(links))) if ACTIVE_TASK else len(links)
    if total <= 0:
        total = len(links)
        set_task_total(total)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=options.headless)
        try:
            for index, url in enumerate(links, start=1):
                ensure_running()
                emit_json(
                    {
                        "type": "progress",
                        "current": index,
                        "total": total,
                        "message": f"\u6b63\u5728\u5904\u7406\uff1a{url}",
                        "url": url,
                        "timestamp": now(),
                    }
                )

                try:
                    result = crawl_single_character_in_browser(
                        browser,
                        url,
                        options,
                        lambda event_type, message, current=index, total_count=total: emit_event(
                            event_type,
                            message,
                            current=current,
                            total=total_count,
                        ),
                        on_image_failed=mark_failed_image,
                    )
                    mark_task_success(result["url"])
                    emit_json(
                        {
                            "type": "character_done",
                            "name": result["name"],
                            "url": result["url"],
                            "timestamp": now(),
                        }
                    )
                except Exception as error:  # noqa: BLE001
                    mark_task_failed(url, str(error))
                    emit_json(
                        {
                            "type": "character_failed",
                            "url": url,
                            "error": str(error),
                            "timestamp": now(),
                        }
                    )
                    continue
        finally:
            browser.close()

    success = int(ACTIVE_TASK.get("success_count", 0)) if ACTIVE_TASK else 0
    failed = int(ACTIVE_TASK.get("failed_count", 0)) if ACTIVE_TASK else 0
    finalize_task("completed" if failed == 0 else "failed")
    emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=success, failed=failed))
    return 0 if failed == 0 and success > 0 else 1


def retry_failed_characters(task_id: str, options: CrawlOptions) -> int:
    if not TASK_REPOSITORY:
        raise RuntimeError("Task repository is not initialized.")
    task = TASK_REPOSITORY.get_task(task_id)
    if not task:
        emit_event("error", f"\u672a\u627e\u5230\u4efb\u52a1\uff1a{task_id}")
        return 1

    attach_existing_task(task)
    failed_urls = [item.get("url", "") for item in task.get("failed_urls", []) if item.get("url")]
    if not failed_urls:
        emit_event("log", "\u5f53\u524d\u4efb\u52a1\u6ca1\u6709\u5931\u8d25\u89d2\u8272\u9700\u8981\u91cd\u8bd5")
        finalize_task("completed" if task.get("failed_count", 0) == 0 else task.get("status", "completed"))
        emit(
            Payload(
                type="done",
                message="\u4efb\u52a1\u7ed3\u675f",
                timestamp=now(),
                success=int(task.get("success_count", 0)),
                failed=int(task.get("failed_count", 0)),
            )
        )
        return 0

    emit_event("log", f"\u5f00\u59cb\u91cd\u8bd5\u5931\u8d25\u89d2\u8272\uff1a{task_id}")
    total = len(failed_urls)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=options.headless)
        try:
            for index, url in enumerate(failed_urls, start=1):
                ensure_running()
                emit_json(
                    {
                        "type": "progress",
                        "current": index,
                        "total": total,
                        "message": f"\u6b63\u5728\u91cd\u8bd5\u5931\u8d25\u89d2\u8272\uff1a{url}",
                        "url": url,
                        "timestamp": now(),
                    }
                )
                try:
                    result = crawl_single_character_in_browser(
                        browser,
                        url,
                        options,
                        lambda event_type, message, current=index, total_count=total: emit_event(
                            event_type,
                            message,
                            current=current,
                            total=total_count,
                        ),
                        on_image_failed=mark_failed_image,
                    )
                    mark_task_success(result["url"])
                    emit_json(
                        {
                            "type": "character_done",
                            "name": result["name"],
                            "url": result["url"],
                            "timestamp": now(),
                        }
                    )
                except Exception as error:  # noqa: BLE001
                    mark_task_failed(url, str(error))
                    emit_json(
                        {
                            "type": "character_failed",
                            "url": url,
                            "error": str(error),
                            "timestamp": now(),
                        }
                    )
        finally:
            browser.close()

    success = int(ACTIVE_TASK.get("success_count", 0)) if ACTIVE_TASK else 0
    failed = int(ACTIVE_TASK.get("failed_count", 0)) if ACTIVE_TASK else 0
    finalize_task("completed" if failed == 0 else "failed")
    emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=success, failed=failed))
    return 0 if failed == 0 else 1


def retry_failed_images(task_id: str, options: CrawlOptions) -> int:
    if not TASK_REPOSITORY:
        raise RuntimeError("Task repository is not initialized.")
    task = TASK_REPOSITORY.get_task(task_id)
    if not task:
        emit_event("error", f"\u672a\u627e\u5230\u4efb\u52a1\uff1a{task_id}")
        return 1

    attach_existing_task(task)
    failed_images = list(task.get("failed_images", []))
    if not failed_images:
        emit_event("log", "\u5f53\u524d\u4efb\u52a1\u6ca1\u6709\u5931\u8d25\u56fe\u7247\u9700\u8981\u91cd\u8bd5")
        finalize_task(task.get("status", "completed"))
        emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=0, failed=0))
        return 0

    output_dir = Path(options.output_dir).resolve()
    recovered = 0
    still_failed = 0
    total = len(failed_images)
    emit_event("log", f"\u5f00\u59cb\u91cd\u8bd5\u5931\u8d25\u56fe\u7247\uff1a{task_id}")

    for index, item in enumerate(failed_images, start=1):
        ensure_running()
        character_name = str(item.get("character_name", "")).strip()
        image_url = str(item.get("url", "")).strip()
        emit_json(
            {
                "type": "progress",
                "current": index,
                "total": total,
                "message": f"\u6b63\u5728\u91cd\u8bd5\u5931\u8d25\u56fe\u7247\uff1a{character_name or image_url}",
                "url": image_url,
                "timestamp": now(),
            }
        )

        try:
            payload = load_character_json(output_dir, character_name)
            referer = str(payload.get("url") or "")
            if not referer:
                raise ValueError(f"Character JSON missing referer URL: {character_name}")

            downloaded = fetch_image(image_url, referer=referer)
            image_index = get_next_image_index(output_dir, character_name)
            saved = save_image_asset(output_dir, character_name, image_index, downloaded)

            images_payload = payload.setdefault("images", {})
            downloaded_list = list(images_payload.get("downloaded", []))
            failed_list = [
                failed_item
                for failed_item in images_payload.get("download_failed", [])
                if failed_item.get("url") != image_url
            ]
            downloaded_list.append(saved)
            images_payload["downloaded"] = downloaded_list
            images_payload["download_failed"] = failed_list
            save_character_json(output_dir, payload)

            recovered += 1
            updated_task = TASK_REPOSITORY.remove_failed_image(ACTIVE_TASK, character_name, image_url)
            set_active_task(updated_task)
            persist_task_update()
        except Exception as error:  # noqa: BLE001
            still_failed += 1
            updated_task = TASK_REPOSITORY.add_failed_image(ACTIVE_TASK, character_name, image_url, str(error))
            set_active_task(updated_task)
            emit_json(
                {
                    "type": "image_failed",
                    "character_name": character_name,
                    "url": image_url,
                    "error": str(error),
                    "timestamp": now(),
                }
            )
            persist_task_update()

    finalize_task("completed" if not ACTIVE_TASK.get("failed_images") else "failed")
    emit(Payload(type="done", message="\u4efb\u52a1\u7ed3\u675f", timestamp=now(), success=recovered, failed=still_failed))
    return 0 if still_failed == 0 else 1


def main() -> int:
    global TASK_REPOSITORY
    args = parse_args()
    options = build_options(args)

    if args.env_check:
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                browser.close()
            emit_json(
                {
                    "type": "env_check",
                    "playwright_available": True,
                    "message": "Playwright Chromium 可用。",
                    "timestamp": now(),
                }
            )
            return 0
        except Exception as error:  # noqa: BLE001
            emit_json(
                {
                    "type": "env_check",
                    "playwright_available": False,
                    "message": f"Playwright Chromium 不可用：{error}",
                    "timestamp": now(),
                }
            )
            return 0

    TASK_REPOSITORY = TaskRepository(Path(options.output_dir).resolve())

    if args.retry_failed_task:
        return retry_failed_characters(args.retry_failed_task, options)

    if args.retry_failed_images:
        return retry_failed_images(args.retry_failed_images, options)

    if not args.mode:
        emit_event("error", "\u7f3a\u5c11 mode \u53c2\u6570")
        return 1

    if args.mode == "single" and not args.url:
        emit_event("error", "single \u6a21\u5f0f\u7f3a\u5c11 URL \u53c2\u6570")
        return 1

    if args.mode == "all":
        return run_all_mode(args, options)

    return run_single_mode(args, options)


if __name__ == "__main__":
    sys.exit(main())
