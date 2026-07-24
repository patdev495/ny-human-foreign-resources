"""Facade module re-exporting status calculation functions from `status_engine/` package.
Ensures 100% backward compatibility for imports from `features.hr_foreign.status_engine`.
"""
from features.hr_foreign.status_engine import (
    evaluate_employee_statuses,
    get_expiring_documents,
    get_warning_configs,
    update_warning_configs,
)

__all__ = [
    "evaluate_employee_statuses",
    "get_expiring_documents",
    "get_warning_configs",
    "update_warning_configs",
]
