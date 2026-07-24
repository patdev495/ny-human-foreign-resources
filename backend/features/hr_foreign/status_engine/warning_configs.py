from __future__ import annotations
from sqlalchemy.orm import Session

from features.hr_foreign.models import DocWarningConfig
from features.hr_foreign.schemas import DocWarningConfigUpdateItem

DEFAULT_DOC_WARNING_CONFIGS = [
    {"doc_type": "VISA", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "TAM_TRU", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "GPLD", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "CONTRACT", "warning_value": 30, "warning_unit": "DAY"},
    {"doc_type": "PASSPORT", "warning_value": 30, "warning_unit": "DAY"},
]


def get_warning_configs(db: Session) -> list[DocWarningConfig]:
    configs = db.query(DocWarningConfig).all()
    existing_types = {c.doc_type for c in configs}
    added = False
    for default in DEFAULT_DOC_WARNING_CONFIGS:
        if default["doc_type"] not in existing_types:
            cfg = DocWarningConfig(
                doc_type=default["doc_type"],
                warning_value=default["warning_value"],
                warning_unit=default["warning_unit"],
            )
            db.add(cfg)
            added = True
    if added:
        db.flush()
        configs = db.query(DocWarningConfig).all()
    return configs


def update_warning_configs(
    db: Session, updates: list[DocWarningConfigUpdateItem]
) -> list[DocWarningConfig]:
    configs = get_warning_configs(db)
    config_map = {c.doc_type: c for c in configs}
    for item in updates:
        if item.doc_type in config_map:
            config_map[item.doc_type].warning_value = item.warning_value
            config_map[item.doc_type].warning_unit = item.warning_unit
    db.commit()
    return get_warning_configs(db)
