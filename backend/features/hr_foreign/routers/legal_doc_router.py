from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session


from core.database import get_db
from features.hr_foreign import excel_exporter, models, service
from features.hr_foreign.schemas import (
    ContractCreate,
    ContractRead,
    ContractUpdate,
    DocWarningConfigResponse,
    DocWarningConfigUpdateItem,
    ExpiringDocumentsResponse,
    TamTruCreate,
    TamTruRead,
    TamTruUpdate,
    VisaCreate,
    VisaRead,
    VisaUpdate,
    WorkPermitCreate,
    WorkPermitRead,
    WorkPermitUpdate,
)

router = APIRouter()


# --- CONTRACTS ENDPOINTS ---

@router.get("/employees/{emp_id}/contracts", response_model=list[ContractRead])
def list_contracts(emp_id: int, db: Session = Depends(get_db)) -> list[ContractRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_contracts_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/contracts",
    response_model=ContractRead,
    status_code=status.HTTP_201_CREATED,
)
def create_contract(
    emp_id: int, payload: ContractCreate, db: Session = Depends(get_db)
) -> ContractRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_contract(db, emp_id, payload)


@router.put("/contracts/{contract_id}", response_model=ContractRead)
def update_contract(
    contract_id: int, payload: ContractUpdate, db: Session = Depends(get_db)
) -> ContractRead:
    c = service.get_contract_by_id(db, contract_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return service.update_contract(db, c, payload)


@router.delete("/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(contract_id: int, db: Session = Depends(get_db)) -> None:
    c = service.get_contract_by_id(db, contract_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    service.delete_contract(db, c)


# --- WORK PERMITS ENDPOINTS ---

@router.get("/employees/{emp_id}/work-permits", response_model=list[WorkPermitRead])
def list_work_permits(emp_id: int, db: Session = Depends(get_db)) -> list[WorkPermitRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_work_permits_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/work-permits",
    response_model=WorkPermitRead,
    status_code=status.HTTP_201_CREATED,
)
def create_work_permit(
    emp_id: int, payload: WorkPermitCreate, db: Session = Depends(get_db)
) -> WorkPermitRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_work_permit(db, emp_id, payload)


@router.put("/work-permits/{permit_id}", response_model=WorkPermitRead)
def update_work_permit(
    permit_id: int, payload: WorkPermitUpdate, db: Session = Depends(get_db)
) -> WorkPermitRead:
    permit = service.get_work_permit_by_id(db, permit_id)
    if not permit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work permit not found")
    return service.update_work_permit(db, permit, payload)


@router.delete("/work-permits/{permit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_permit(permit_id: int, db: Session = Depends(get_db)) -> None:
    permit = service.get_work_permit_by_id(db, permit_id)
    if not permit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work permit not found")
    service.delete_work_permit(db, permit)


# --- VISAS ENDPOINTS ---

@router.get("/employees/{emp_id}/visas", response_model=list[VisaRead])
def list_visas(emp_id: int, db: Session = Depends(get_db)) -> list[VisaRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_visas_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/visas",
    response_model=VisaRead,
    status_code=status.HTTP_201_CREATED,
)
def create_visa(
    emp_id: int, payload: VisaCreate, db: Session = Depends(get_db)
) -> VisaRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_visa(db, emp_id, payload)


@router.put("/visas/{visa_id}", response_model=VisaRead)
def update_visa(
    visa_id: int, payload: VisaUpdate, db: Session = Depends(get_db)
) -> VisaRead:
    visa = service.get_visa_by_id(db, visa_id)
    if not visa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visa not found")
    return service.update_visa(db, visa, payload)


@router.delete("/visas/{visa_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visa(visa_id: int, db: Session = Depends(get_db)) -> None:
    visa = service.get_visa_by_id(db, visa_id)
    if not visa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visa not found")
    service.delete_visa(db, visa)


# --- TAM TRU ENDPOINTS ---

@router.get("/employees/{emp_id}/tam-trus", response_model=list[TamTruRead])
def list_tam_trus(emp_id: int, db: Session = Depends(get_db)) -> list[TamTruRead]:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.get_tam_trus_by_employee(db, emp_id)


@router.post(
    "/employees/{emp_id}/tam-trus",
    response_model=TamTruRead,
    status_code=status.HTTP_201_CREATED,
)
def create_tam_tru(
    emp_id: int, payload: TamTruCreate, db: Session = Depends(get_db)
) -> TamTruRead:
    emp = service.get_employee_by_id(db, emp_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return service.create_tam_tru(db, emp_id, payload)


@router.put("/tam-trus/{tam_tru_id}", response_model=TamTruRead)
def update_tam_tru(
    tam_tru_id: int, payload: TamTruUpdate, db: Session = Depends(get_db)
) -> TamTruRead:
    tam_tru = service.get_tam_tru_by_id(db, tam_tru_id)
    if not tam_tru:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tam tru not found")
    return service.update_tam_tru(db, tam_tru, payload)


@router.delete("/tam-trus/{tam_tru_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tam_tru(tam_tru_id: int, db: Session = Depends(get_db)) -> None:
    tam_tru = service.get_tam_tru_by_id(db, tam_tru_id)
    if not tam_tru:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tam tru not found")
    service.delete_tam_tru(db, tam_tru)


# --- EXPIRING DOCUMENTS & WARNING CONFIG ENDPOINTS ---

@router.get("/doc-warning-configs", response_model=DocWarningConfigResponse)
def get_doc_warning_configs(db: Session = Depends(get_db)) -> DocWarningConfigResponse:
    configs = service.get_warning_configs(db)
    return DocWarningConfigResponse(configs=configs)


@router.put("/doc-warning-configs", response_model=DocWarningConfigResponse)
def update_doc_warning_configs(
    payload: list[DocWarningConfigUpdateItem], db: Session = Depends(get_db)
) -> DocWarningConfigResponse:
    configs = service.update_warning_configs(db, payload)
    return DocWarningConfigResponse(configs=configs)


@router.get("/expiring-documents", response_model=ExpiringDocumentsResponse)
def get_expiring_documents(
    days: int | None = Query(default=None, ge=1, le=365), db: Session = Depends(get_db)
) -> ExpiringDocumentsResponse:
    return service.get_expiring_documents(db, days=days)


def _resolve_attachment_file_path(file_path: str | None) -> str | None:
    if not file_path:
        return None
    if os.path.isabs(file_path) and os.path.exists(file_path):
        return file_path

    # legal_doc_router.py path: backend/features/hr_foreign/routers/legal_doc_router.py
    # parents[3] points directly to backend/
    backend_dir = Path(__file__).resolve().parents[3]

    candidates = [
        backend_dir / file_path,
        Path(os.getcwd()) / file_path,
        Path(service.UPLOAD_DIR) / file_path,
        Path(service.UPLOAD_DIR) / Path(file_path).name,
        backend_dir / "uploads" / "documents" / Path(file_path).name,
        backend_dir / "uploads" / Path(file_path).name,
    ]

    for cand in candidates:
        if cand.exists():
            return str(cand)

    return None


# --- EXPORT REPORTS ENDPOINTS ---

@router.get("/exports/legal-profile")
def export_legal_profile(
    include_attachments: bool = Query(False),
    db: Session = Depends(get_db),
) -> Response:
    excel_buf = excel_exporter.generate_legal_profile_excel(db)

    if include_attachments:
        attachments_list = []
        all_attachments = db.query(models.DocumentAttachment).all()
        for att in all_attachments:
            full_path = _resolve_attachment_file_path(att.file_path)
            if full_path:
                emp = None
                if att.entity_type == "PASSPORT":
                    emp = db.query(models.ForeignEmployee).filter(models.ForeignEmployee.id == att.entity_id).first()
                elif att.entity_type in ("VISA", "TAM_TRU"):
                    if att.entity_type == "VISA":
                        v = db.query(models.Visa).filter(models.Visa.id == att.entity_id).first()
                        emp = v.employee if v else None
                    else:
                        tt = db.query(models.TamTru).filter(models.TamTru.id == att.entity_id).first()
                        emp = tt.employee if tt else None
                elif att.entity_type == "WORK_PERMIT":
                    wp = db.query(models.WorkPermit).filter(models.WorkPermit.id == att.entity_id).first()
                    emp = wp.employee if wp else None
                elif att.entity_type == "CONTRACT":
                    ct = db.query(models.Contract).filter(models.Contract.id == att.entity_id).first()
                    emp = ct.employee if ct else None

                # Exclude Janitors from Legal Profile report attachments
                if emp and emp.employee_type == "JANITORIAL":
                    continue

                emp_code = emp.employee_code if emp else None
                emp_name = emp.name_latin if emp else None

                with open(full_path, "rb") as f:
                    content = f.read()

                attachments_list.append({
                    "employee_code": emp_code or "NV_KHONG_MA",
                    "employee_name": emp_name or "NHAN_VIEN",
                    "file_name": att.file_name,
                    "content": content,
                })

        zip_buf = excel_exporter.create_report_zip_package(
            excel_bytes=excel_buf,
            excel_filename="Bao_Cao_Ho_So_Phap_Ly.xlsx",
            attachments=attachments_list,
        )
        return Response(
            content=zip_buf.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Ho_So_Phap_Ly.zip"'},
        )

    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Ho_So_Phap_Ly.xlsx"'},
    )


@router.get("/exports/presence-accommodation")
def export_presence_accommodation(
    db: Session = Depends(get_db),
) -> Response:
    excel_buf = excel_exporter.generate_presence_accommodation_excel(db)
    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Bao_Cao_Hien_Dien_Cho_O.xlsx"'},
    )


@router.get("/exports/trip-duration")
def export_trip_duration(
    start_date: date = Query(...),
    end_date: date = Query(...),
    employee_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> Response:
    excel_buf = excel_exporter.generate_trip_duration_excel(
        db, start_date=start_date, end_date=end_date, employee_id=employee_id
    )
    filename = f"Bao_Cao_Dot_Luu_Tru_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.xlsx"
    return Response(
        content=excel_buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


