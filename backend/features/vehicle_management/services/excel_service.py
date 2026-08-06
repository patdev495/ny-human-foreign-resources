from __future__ import annotations

from io import BytesIO
from sqlalchemy.orm import Session

from features.vehicle_management.services.exporters import (
    export_vehicle_excel_report,
    generate_duc_anh_report,
    generate_duc_anh_zip_report,
    build_binh_an_excel_report,
)


def generate_single_vehicle_excel_file(
    db: Session, contract, from_date: str, to_date: str
) -> BytesIO:
    return generate_duc_anh_report(db, contract, from_date, to_date)


def generate_duc_anh_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    return generate_duc_anh_zip_report(db, from_date, to_date)


def generate_binh_an_excel_report(db: Session, from_date: str, to_date: str) -> BytesIO:
    return build_binh_an_excel_report(db, from_date, to_date)


__all__ = [
    "export_vehicle_excel_report",
    "generate_single_vehicle_excel_file",
    "generate_duc_anh_excel_report",
    "generate_binh_an_excel_report",
    "generate_duc_anh_zip_report",
]
