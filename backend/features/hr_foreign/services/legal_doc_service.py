from __future__ import annotations
import datetime
from sqlalchemy.orm import Session

from features.hr_foreign.models import Contract, TamTru, Visa, WorkPermit
from features.hr_foreign.schemas import (
    ContractCreate,
    ContractUpdate,
    ExpiringDocumentsResponse,
    TamTruCreate,
    TamTruUpdate,
    VisaCreate,
    VisaUpdate,
    WorkPermitCreate,
    WorkPermitUpdate,
)
from features.hr_foreign.status_engine import (
    get_expiring_documents as status_engine_get_expiring_documents,
    get_warning_configs as status_engine_get_warning_configs,
    update_warning_configs as status_engine_update_warning_configs,
)


# --- CONTRACTS ---

def get_contracts_by_employee(db: Session, employee_id: int) -> list[Contract]:
    return (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date)
        .all()
    )


def get_contract_by_id(db: Session, contract_id: int) -> Contract | None:
    return db.query(Contract).filter(Contract.id == contract_id).first()


def create_contract(db: Session, employee_id: int, payload: ContractCreate) -> Contract:
    c = Contract(employee_id=employee_id, **payload.model_dump())
    db.add(c)
    db.flush()
    db.commit()
    db.refresh(c)
    return c


def update_contract(db: Session, contract: Contract, payload: ContractUpdate) -> Contract:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)
    db.commit()
    db.refresh(contract)
    return contract


def delete_contract(db: Session, contract: Contract) -> None:
    db.delete(contract)
    db.commit()


# --- WORK PERMITS ---

def get_work_permits_by_employee(db: Session, employee_id: int) -> list[WorkPermit]:
    return (
        db.query(WorkPermit)
        .filter(WorkPermit.employee_id == employee_id)
        .order_by(WorkPermit.valid_from)
        .all()
    )


def get_work_permit_by_id(db: Session, permit_id: int) -> WorkPermit | None:
    return db.query(WorkPermit).filter(WorkPermit.id == permit_id).first()


def create_work_permit(db: Session, employee_id: int, payload: WorkPermitCreate) -> WorkPermit:
    permit = WorkPermit(employee_id=employee_id, **payload.model_dump())
    db.add(permit)
    db.flush()
    db.commit()
    db.refresh(permit)
    return permit


def update_work_permit(db: Session, permit: WorkPermit, payload: WorkPermitUpdate) -> WorkPermit:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(permit, key, value)
    db.commit()
    db.refresh(permit)
    return permit


def delete_work_permit(db: Session, permit: WorkPermit) -> None:
    db.delete(permit)
    db.commit()


# --- VISAS ---

def get_visas_by_stay(db: Session, stay_id: int) -> list[Visa]:
    return db.query(Visa).filter(Visa.stay_id == stay_id).all()


def get_visa_by_id(db: Session, visa_id: int) -> Visa | None:
    return db.query(Visa).filter(Visa.id == visa_id).first()


def create_visa(db: Session, stay_id: int, payload: VisaCreate) -> Visa:
    visa = Visa(stay_id=stay_id, **payload.model_dump())
    db.add(visa)
    db.flush()
    db.commit()
    db.refresh(visa)
    return visa


def delete_visa(db: Session, visa: Visa) -> None:
    db.delete(visa)
    db.commit()


def update_visa(db: Session, visa: Visa, payload: VisaUpdate) -> Visa:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(visa, key, value)
    db.commit()
    db.refresh(visa)
    return visa


# --- TAM TRU ---

def get_tam_trus_by_stay(db: Session, stay_id: int) -> list[TamTru]:
    return db.query(TamTru).filter(TamTru.stay_id == stay_id).all()


def get_tam_tru_by_id(db: Session, tam_tru_id: int) -> TamTru | None:
    return db.query(TamTru).filter(TamTru.id == tam_tru_id).first()


def create_tam_tru(db: Session, stay_id: int, payload: TamTruCreate) -> TamTru:
    tam_tru = TamTru(stay_id=stay_id, **payload.model_dump())
    db.add(tam_tru)
    db.flush()
    db.commit()
    db.refresh(tam_tru)
    return tam_tru


def delete_tam_tru(db: Session, tam_tru: TamTru) -> None:
    db.delete(tam_tru)
    db.commit()


def update_tam_tru(db: Session, tam_tru: TamTru, payload: TamTruUpdate) -> TamTru:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tam_tru, key, value)
    db.commit()
    db.refresh(tam_tru)
    return tam_tru


# --- EXPIRING DOCUMENTS & WARNING CONFIGS ---

def get_warning_configs(db: Session):
    return status_engine_get_warning_configs(db)


def update_warning_configs(db: Session, updates):
    return status_engine_update_warning_configs(db, updates)


def get_expiring_documents(
    db: Session, days: int | None = None, today: datetime.date | None = None
) -> ExpiringDocumentsResponse:
    return status_engine_get_expiring_documents(db, days=days, today=today)
