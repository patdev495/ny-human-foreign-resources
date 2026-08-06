from __future__ import annotations

from io import BytesIO
from sqlalchemy.orm import Session

from features.vehicle_management.services.exporters.duc_anh_exporter import generate_duc_anh_zip_report
from features.vehicle_management.services.exporters.binh_an_exporter import build_binh_an_excel_report


def export_vehicle_excel_report(
    db: Session,
    provider_type: str,
    from_date: str,
    to_date: str,
) -> tuple[BytesIO, str, str]:
    """
    Unified Vehicle Report Exporter Interface.
    Returns (excel_or_zip_bytes, filename, media_type).
    """
    if provider_type == "COMPANY_OWNED":
        excel_io = generate_duc_anh_zip_report(db, from_date, to_date)
        filename = f"Bao_Cao_3_Xe_Duc_Anh_{from_date}_den_{to_date}.zip"
        media_type = "application/zip"
        return excel_io, filename, media_type
    else:
        excel_io = build_binh_an_excel_report(db, from_date, to_date)
        filename = f"Bang_Ke_Chuyen_Xe_Binh_An_{from_date}_den_{to_date}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        return excel_io, filename, media_type
