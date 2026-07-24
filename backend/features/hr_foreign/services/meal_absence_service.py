from __future__ import annotations
from sqlalchemy.orm import Session

from features.hr_foreign.models import MealAbsence
from features.hr_foreign.schemas import MealAbsenceCreate


def get_meal_absences_by_stay(db: Session, stay_id: int) -> list[MealAbsence]:
    return db.query(MealAbsence).filter(MealAbsence.stay_id == stay_id).all()


def get_meal_absence_by_id(db: Session, abs_id: int) -> MealAbsence | None:
    return db.query(MealAbsence).filter(MealAbsence.id == abs_id).first()


def create_meal_absence(db: Session, stay_id: int, payload: MealAbsenceCreate) -> MealAbsence:
    absence = MealAbsence(stay_id=stay_id, **payload.model_dump())
    db.add(absence)
    db.flush()
    db.commit()
    db.refresh(absence)
    return absence


def delete_meal_absence(db: Session, absence: MealAbsence) -> None:
    db.delete(absence)
    db.commit()
