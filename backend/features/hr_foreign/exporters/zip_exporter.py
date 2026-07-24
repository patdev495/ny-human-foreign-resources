from __future__ import annotations

import io
import zipfile
from .excel_styles import build_attachment_zip_path


def create_report_zip_package(
    excel_bytes: io.BytesIO,
    excel_filename: str,
    attachments: list[dict] | None = None
) -> io.BytesIO:
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

    zip_buf.seek(0)
    return zip_buf
