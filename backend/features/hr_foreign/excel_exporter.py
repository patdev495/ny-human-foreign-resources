"""Facade module re-exporting Excel & ZIP exporter functions from `exporters/` package.
Ensures 100% backward compatibility for imports from `features.hr_foreign.excel_exporter`.
"""
from features.hr_foreign.exporters import (
    build_attachment_zip_folder,
    build_attachment_zip_path,
    create_report_zip_package,
    generate_legal_profile_excel,
    generate_presence_accommodation_excel,
    generate_meal_expense_excel,
)

__all__ = [
    "build_attachment_zip_folder",
    "build_attachment_zip_path",
    "create_report_zip_package",
    "generate_legal_profile_excel",
    "generate_presence_accommodation_excel",
    "generate_meal_expense_excel",
]


