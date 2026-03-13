"""
Model Registry — version models by timestamp + metrics.
"""

import json
import shutil
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)
REGISTRY_DIR = Path(__file__).parent / "models"
REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_FILE = REGISTRY_DIR / "registry.json"


def _load_registry() -> dict:
    if REGISTRY_FILE.exists():
        return json.loads(REGISTRY_FILE.read_text())
    return {}


def _save_registry(registry: dict):
    REGISTRY_FILE.write_text(json.dumps(registry, indent=2))


def register_model(
    model_name: str,
    model_path: Path,
    metrics: dict,
    promoted: bool = False,
) -> str:
    """Register a model version; return version tag."""
    registry = _load_registry()
    version  = datetime.now().strftime("v%Y%m%d_%H%M%S")

    version_dir = REGISTRY_DIR / model_name / version
    version_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(model_path, version_dir / model_path.name)

    entry = {
        "version":    version,
        "model_path": str(version_dir / model_path.name),
        "metrics":    metrics,
        "promoted":   promoted,
        "registered_at": datetime.now().isoformat(),
    }

    if model_name not in registry:
        registry[model_name] = []

    # Un-promote previous if promoting new
    if promoted:
        for v in registry[model_name]:
            v["promoted"] = False

    registry[model_name].append(entry)
    _save_registry(registry)
    logger.info(f"Registered {model_name}@{version} (promoted={promoted})")
    return version


def get_latest_version(model_name: str) -> dict | None:
    registry = _load_registry()
    versions = registry.get(model_name, [])
    if not versions:
        return None
    return sorted(versions, key=lambda v: v["registered_at"])[-1]


def get_promoted_version(model_name: str) -> dict | None:
    registry = _load_registry()
    promoted = [v for v in registry.get(model_name, []) if v.get("promoted")]
    return promoted[-1] if promoted else None


def list_versions(model_name: str) -> list[dict]:
    return _load_registry().get(model_name, [])


def promote_version(model_name: str, version: str) -> bool:
    registry = _load_registry()
    for v in registry.get(model_name, []):
        v["promoted"] = (v["version"] == version)
    _save_registry(registry)
    logger.info(f"Promoted {model_name}@{version}")
    return True
