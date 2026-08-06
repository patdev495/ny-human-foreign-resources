"""Facade module re-exporting status calculation functions and EmployeeLifecycleEngine.
Ensures 100% backward compatibility for imports from `features.hr_foreign.status_engine`.
"""
from features.hr_foreign.status_engine import (
    evaluate_employee_statuses,
    get_expiring_documents,
    get_warning_configs,
    update_warning_configs,
)
from features.hr_foreign.services.lifecycle_engine import EmployeeLifecycleEngine

__all__ = [
    "evaluate_employee_statuses",
    "get_expiring_documents",
    "get_warning_configs",
    "update_warning_configs",
    "EmployeeLifecycleEngine",
]
