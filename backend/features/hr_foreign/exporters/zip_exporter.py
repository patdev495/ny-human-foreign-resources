from __future__ import annotations

import io
import zipfile
from typing import Any
from .excel_styles import build_attachment_zip_path


class ReportPackageExporter:
    """Deep generic exporter for building ZIP packages with Excel reports and document attachments."""

    @classmethod
    def create_report_zip_package(
        cls,
        excel_bytes: io.BytesIO,
        excel_filename: str,
        attachments: list[dict[str, Any]] | None = None,
        custom_files: dict[str, bytes] | None = None,
    ) -> io.BytesIO:
        """Create a compressed ZIP buffer containing an Excel report and attachments."""
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(excel_filename, excel_bytes.getvalue())

            if attachments:
                for item in attachments:
                    code = item.get("employee_code")
                    name = item.get("employee_name")
                    file_name = item.get("file_name", "document.dat")
                    content = item.get("content", b"")
                    arc_path = build_attachment_zip_path(code, name, file_name)
                    zf.writestr(arc_path, content)

            if custom_files:
                for rel_path, file_data in custom_files.items():
                    zf.writestr(rel_path, file_data)

        zip_buf.seek(0)
        return zip_buf


def create_report_zip_package(
    excel_bytes: io.BytesIO,
    excel_filename: str,
    attachments: list[dict[str, Any]] | None = None,
) -> io.BytesIO:
    """Backward-compatible helper function delegating to ReportPackageExporter."""
    return ReportPackageExporter.create_report_zip_package(
        excel_bytes=excel_bytes,
        excel_filename=excel_filename,
        attachments=attachments,
    )
