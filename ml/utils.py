import json
import re
from pathlib import Path
from typing import Any, Dict


def load_config(path: str = "config.json") -> Dict[str, Any]:
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config not found: {config_path}")
    return json.loads(config_path.read_text(encoding="utf-8"))


def ensure_dir(path: str) -> Path:
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def save_json(data: Dict[str, Any], path: str) -> None:
    Path(path).write_text(
        json.dumps(data, indent=2, sort_keys=True),
        encoding="utf-8"
    )


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\-\&\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
