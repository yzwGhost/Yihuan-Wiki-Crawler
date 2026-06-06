from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now().isoformat()


def create_task_id() -> str:
    return f"{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:8]}"


class TaskRepository:
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir).resolve()
        self.tasks_dir = self.output_dir / "tasks"
        self.tasks_file = self.tasks_dir / "tasks.json"
        self.logs_dir = self.tasks_dir / "logs"
        self.tasks_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)

    def _read_tasks(self) -> list[dict[str, Any]]:
        if not self.tasks_file.exists():
            return []
        try:
            payload = json.loads(self.tasks_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []
        return payload if isinstance(payload, list) else []

    def _write_tasks(self, tasks: list[dict[str, Any]]) -> None:
        self.tasks_file.write_text(
            json.dumps(tasks, ensure_ascii=False, indent=2),
            encoding="utf-8-sig",
        )

    def list_tasks(self) -> list[dict[str, Any]]:
        return self._read_tasks()

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        for task in self._read_tasks():
            if task.get("task_id") == task_id:
                return task
        return None

    def create_task(self, mode: str) -> dict[str, Any]:
        tasks = self._read_tasks()
        task_id = create_task_id()
        log_path = self.logs_dir / f"{task_id}.log"
        task = {
            "task_id": task_id,
            "mode": mode,
            "status": "running",
            "total": 0,
            "success_count": 0,
            "failed_count": 0,
            "started_at": now_iso(),
            "finished_at": None,
            "success_urls": [],
            "failed_urls": [],
            "failed_images": [],
            "log_path": str(log_path),
        }
        tasks.append(task)
        self._write_tasks(tasks)
        return deepcopy(task)

    def save_task(self, task: dict[str, Any]) -> dict[str, Any]:
        tasks = self._read_tasks()
        updated = False
        for index, existing in enumerate(tasks):
            if existing.get("task_id") == task.get("task_id"):
                tasks[index] = task
                updated = True
                break
        if not updated:
            tasks.append(task)
        self._write_tasks(tasks)
        return deepcopy(task)

    def append_log(self, task: dict[str, Any], line: str) -> None:
        log_path = Path(str(task.get("log_path") or self.logs_dir / f"{task['task_id']}.log"))
        log_path.parent.mkdir(parents=True, exist_ok=True)
        if not log_path.exists():
            log_path.write_text("", encoding="utf-8-sig")
        with log_path.open("a", encoding="utf-8-sig") as handle:
            handle.write(line.rstrip("\n"))
            handle.write("\n")

    def set_total(self, task: dict[str, Any], total: int) -> dict[str, Any]:
        task["total"] = max(0, total)
        return self.save_task(task)

    def add_success_url(self, task: dict[str, Any], url: str) -> dict[str, Any]:
        success_urls = list(task.get("success_urls", []))
        if url not in success_urls:
            success_urls.append(url)
        task["success_urls"] = success_urls
        task["success_count"] = len(success_urls)
        task["failed_urls"] = [
            item for item in task.get("failed_urls", []) if item.get("url") != url
        ]
        task["failed_count"] = len(task["failed_urls"])
        return self.save_task(task)

    def add_failed_url(self, task: dict[str, Any], url: str, error: str) -> dict[str, Any]:
        failed_urls = [
            item for item in task.get("failed_urls", []) if item.get("url") != url
        ]
        failed_urls.append({"url": url, "error": error})
        task["failed_urls"] = failed_urls
        task["failed_count"] = len(failed_urls)
        return self.save_task(task)

    def remove_failed_url(self, task: dict[str, Any], url: str) -> dict[str, Any]:
        task["failed_urls"] = [
            item for item in task.get("failed_urls", []) if item.get("url") != url
        ]
        task["failed_count"] = len(task["failed_urls"])
        return self.save_task(task)

    def add_failed_image(
        self,
        task: dict[str, Any],
        character_name: str,
        url: str,
        error: str,
    ) -> dict[str, Any]:
        failed_images = [
            item
            for item in task.get("failed_images", [])
            if not (
                item.get("character_name") == character_name
                and item.get("url") == url
            )
        ]
        failed_images.append(
            {
                "character_name": character_name,
                "url": url,
                "error": error,
            }
        )
        task["failed_images"] = failed_images
        return self.save_task(task)

    def remove_failed_image(
        self,
        task: dict[str, Any],
        character_name: str,
        url: str,
    ) -> dict[str, Any]:
        task["failed_images"] = [
            item
            for item in task.get("failed_images", [])
            if not (
                item.get("character_name") == character_name
                and item.get("url") == url
            )
        ]
        return self.save_task(task)

    def mark_status(
        self,
        task: dict[str, Any],
        status: str,
        finished: bool = False,
    ) -> dict[str, Any]:
        task["status"] = status
        if finished:
            task["finished_at"] = now_iso()
        return self.save_task(task)

    def get_latest_resumable_task(self) -> dict[str, Any] | None:
        tasks = [
            task
            for task in self._read_tasks()
            if task.get("mode") == "all" and task.get("status") in {"running", "failed", "stopped"}
        ]
        if not tasks:
            return None
        tasks.sort(key=lambda item: str(item.get("started_at", "")), reverse=True)
        return deepcopy(tasks[0])
