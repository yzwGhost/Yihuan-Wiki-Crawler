from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from downloader import DownloadedImageContent


def sanitize_name(value: str) -> str:
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1F]', "_", value).strip()
    return sanitized or "unknown-character"


def ensure_output_dirs(output_dir: Path, character_name: str) -> tuple[Path, Path]:
    characters_dir = output_dir / "characters"
    images_dir = output_dir / "images" / sanitize_name(character_name)
    characters_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    return characters_dir, images_dir


def save_image_asset(
    output_dir: Path,
    character_name: str,
    index: int,
    payload: DownloadedImageContent,
) -> dict[str, str]:
    _, images_dir = ensure_output_dirs(output_dir, character_name)
    file_name = f"{index:03d}{payload.extension}"
    target_path = images_dir / file_name
    target_path.write_bytes(payload.content)
    return {
        "url": payload.url,
        "local_path": str(target_path.relative_to(output_dir.parent)),
        "content_type": payload.content_type,
        "status": "downloaded",
    }


def save_character_json(output_dir: Path, payload: dict) -> Path:
    characters_dir, _ = ensure_output_dirs(output_dir, str(payload.get("name", "unknown-character")))
    file_name = f"{sanitize_name(str(payload.get('name', 'unknown-character')))}.json"
    target_path = characters_dir / file_name
    target_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return target_path


def get_character_json_path(output_dir: Path, character_name: str) -> Path:
    characters_dir, _ = ensure_output_dirs(output_dir, character_name)
    file_name = f"{sanitize_name(character_name)}.json"
    return characters_dir / file_name


def load_character_json(output_dir: Path, character_name: str) -> dict[str, Any]:
    target_path = get_character_json_path(output_dir, character_name)
    return json.loads(target_path.read_text(encoding="utf-8"))


def get_next_image_index(output_dir: Path, character_name: str) -> int:
    _, images_dir = ensure_output_dirs(output_dir, character_name)
    existing_indices = []
    for file_path in images_dir.iterdir():
        if not file_path.is_file():
            continue
        try:
            existing_indices.append(int(file_path.stem))
        except ValueError:
            continue
    return max(existing_indices, default=0) + 1


def save_candidate_links_json(output_dir: Path, links: list[str]) -> Path:
    characters_dir = output_dir / "characters"
    characters_dir.mkdir(parents=True, exist_ok=True)
    target_path = characters_dir / "candidate_links.json"
    target_path.write_text(
        json.dumps({"total": len(links), "links": links}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return target_path


def load_candidate_links_json(output_dir: Path) -> list[str]:
    target_path = output_dir / "characters" / "candidate_links.json"
    if not target_path.exists():
        return []
    payload = json.loads(target_path.read_text(encoding="utf-8"))
    links = payload.get("links", [])
    return links if isinstance(links, list) else []
