from __future__ import annotations

import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from core.database import get_db

from features.hr_foreign import service
from features.hr_foreign.schemas import (
    DocumentAttachmentResponse,
    EmployeeHistoryResponse,
    ExitDateActionRequest,
    ForeignEmployeeCreate,
    ForeignEmployeeRead,
    ForeignEmployeeUpdate,
    TravelRecordCreate,
    TravelRecordRead,
    TravelRecordUpdate,
)

router = APIRouter()


# --- FOREIGN EMPLOYEES ENDPOINTS ---

@router.get("/employees", response_model=list[ForeignEmployeeRead])
def list_employees(
    q: str | None = Query(default=None), db: Session = Depends(get_db)
) -> list[ForeignEmployeeRead]:
    return service.get_employees_read(db, q=q)


@router.get("/employees/{emp_id}", response_model=ForeignEmployeeRead)
def get_employee(emp_id: int, db: Session = Depends(get_db)) -> ForeignEmployeeRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.to_employee_read(db, emp)


@router.get("/employees/{emp_id}/history", response_model=EmployeeHistoryResponse)
def get_employee_history(emp_id: int, db: Session = Depends(get_db)) -> EmployeeHistoryResponse:
    history = service.get_employee_history(db, emp_id)
    if not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return history


@router.post(
    "/employees", response_model=ForeignEmployeeRead, status_code=status.HTTP_201_CREATED
)
def create_employee(
    payload: ForeignEmployeeCreate, db: Session = Depends(get_db)
) -> ForeignEmployeeRead:
    emp = service.create_employee(db, payload)
    return service.to_employee_read(db, emp)


@router.put("/employees/{emp_id}", response_model=ForeignEmployeeRead)
def update_employee(
    emp_id: int, payload: ForeignEmployeeUpdate, db: Session = Depends(get_db)
) -> ForeignEmployeeRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    updated_emp = service.update_employee(db, emp, payload)
    return service.to_employee_read(db, updated_emp)


@router.delete("/employees/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(emp_id: int, db: Session = Depends(get_db)) -> None:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    service.delete_employee(db, emp)


# --- TRAVEL RECORDS ENDPOINTS ---

@router.get("/employees/{emp_id}/travel-records", response_model=list[TravelRecordRead])
def list_travel_records(emp_id: int, db: Session = Depends(get_db)) -> list[TravelRecordRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.list_travel_records(db, emp_id)


@router.post(
    "/employees/{emp_id}/travel-records",
    response_model=TravelRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_travel_record(
    emp_id: int, payload: TravelRecordCreate, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_travel_record(db, emp, payload)


@router.put("/employees/{emp_id}/travel-records/{record_id}", response_model=TravelRecordRead)
def update_travel_record(
    emp_id: int, record_id: int, payload: TravelRecordUpdate, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    record = service.get_travel_record_by_id(db, record_id)
    if not record or record.employee_id != emp_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel record not found")
    return service.update_travel_record(db, record, payload)


@router.post("/employees/{emp_id}/record-exit", response_model=TravelRecordRead)
def record_employee_exit(
    emp_id: int, payload: ExitDateActionRequest, db: Session = Depends(get_db)
) -> TravelRecordRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.record_employee_exit(db, emp, payload)


# --- DOCUMENT ATTACHMENTS ENDPOINTS ---

@router.post("/attachments", response_model=DocumentAttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    db: Session = Depends(get_db),
) -> DocumentAttachmentResponse:
    return service.save_attachment(db, file=file, entity_type=entity_type, entity_id=entity_id)


@router.get("/attachments", response_model=list[DocumentAttachmentResponse])
def list_attachments(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
) -> list[DocumentAttachmentResponse]:
    return service.list_attachments(db, entity_type=entity_type, entity_id=entity_id)


@router.get("/attachments/{attachment_id}/preview")
def preview_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    attachment = service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")
    return FileResponse(
        path=service.get_attachment_full_path(attachment),
        media_type=attachment.mime_type,
        headers={"Content-Disposition": f'inline; filename="{attachment.file_name}"'},
    )


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    attachment = service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")
    return FileResponse(
        path=service.get_attachment_full_path(attachment),
        media_type=attachment.mime_type,
        filename=attachment.file_name,
    )




@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
) -> None:
    success = service.delete_attachment(db, attachment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tệp đính kèm không tồn tại")
