from __future__ import annotations

import enum
import os
import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from features.hr_foreign.models import DocumentAttachment


class DocumentEntityTypeEnum(str, enum.Enum):
    PASSPORT = "PASSPORT"
    VISA = "VISA"
    TAM_TRU = "TAM_TRU"
    WORK_PERMIT = "WORK_PERMIT"
    CONTRACT = "CONTRACT"


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


def save_attachment(
    db: Session,
    entity_type: str,
    entity_id: int,
    file: UploadFile,
) -> DocumentAttachment:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng file '{ext}' không được hỗ trợ. Chỉ chấp nhận: PDF, JPG, JPEG, PNG.",
        )

    try:
        valid_entity_enum = DocumentEntityTypeEnum(entity_type.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Mã loại thực thể '{entity_type}' không hợp lệ.",
        )

    file_content = file.file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Kích thước file vượt quá giới hạn tối đa 10 MB.",
        )


    os.makedirs(UPLOAD_DIR, exist_ok=True)
    storage_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, storage_name)

    with open(file_path, "wb") as f:
        f.write(file_content)

    attachment = DocumentAttachment(
        entity_type=valid_entity_enum.value,
        entity_id=entity_id,
        file_name=file.filename or "file_dinh_kem",
        file_path=storage_name,
        file_size=len(file_content),
        mime_type=file.content_type or "application/octet-stream",
    )
    db.add(attachment)
    db.flush()
    db.commit()
    db.refresh(attachment)
    return attachment


def list_attachments(
    db: Session, entity_type: str, entity_id: int
) -> list[DocumentAttachment]:
    return (
        db.query(DocumentAttachment)
        .filter(
            DocumentAttachment.entity_type == entity_type.upper(),
            DocumentAttachment.entity_id == entity_id,
        )
        .order_by(DocumentAttachment.created_at.desc())
        .all()
    )


def get_attachment(db: Session, attachment_id: int) -> DocumentAttachment | None:
    return (
        db.query(DocumentAttachment)
        .filter(DocumentAttachment.id == attachment_id)
        .first()
    )


def get_attachment_full_path(attachment: DocumentAttachment) -> str:
    return os.path.join(UPLOAD_DIR, attachment.file_path)


def delete_attachment(db: Session, attachment: DocumentAttachment | int) -> bool:
    if isinstance(attachment, int):
        att_obj = get_attachment(db, attachment)
        if not att_obj:
            return False
        attachment = att_obj

    full_path = get_attachment_full_path(attachment)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass

    db.delete(attachment)
    db.commit()
    return True


