"""
utils.py — shared helpers for the ExpenseIQ ML pipeline.

Used by: predictor.py, train_model.py, data_pipeline.py
"""

import json
import os
import re
from pathlib import Path
from typing import Any


def load_config(path: str = "config.json") -> dict:
    """Load config.json from the current working directory."""
    config_path = Path(path)
    if not config_path.exists():
        # Sensible defaults so scripts still run without config
        return {
            "data_path": "bank_sms_data.csv",
            "artifacts_dir": "artifacts",
            "model_dir": "artifacts/models",
            "metrics_dir": "artifacts/metrics",
            "random_state": 42,
            "test_size": 0.15,
            "val_size": 0.15,
            "min_rows_per_class": 3,
        }
    with open(config_path) as f:
        return json.load(f)


def normalize_text(text: str) -> str:
    """
    Lowercase, strip punctuation, collapse whitespace.
    Must match the normalization done at train time.
    """
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def ensure_dir(path: str | Path) -> Path:
    """Create a directory (and parents) if it doesn't exist. Returns Path."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_json(data: Any, path: str) -> None:
    """Write data to a JSON file, creating parent directories as needed."""
    p = Path(path)
    ensure_dir(p.parent)
    with open(p, "w") as f:
        json.dump(data, f, indent=2, default=str)