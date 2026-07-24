from __future__ import annotations
import datetime
from sqlalchemy.orm import Session

from features.hr_foreign.models import EventDay
from features.hr_foreign.schemas import EventDayCreate, EventDayCreateBatch, EventDayUpdate


def get_event_days(db: Session) -> list[EventDay]:
    return db.query(EventDay).order_by(EventDay.event_date.asc()).all()


def get_event_day_by_id(db: Session, ev_id: int) -> EventDay | None:
    return db.query(EventDay).filter(EventDay.id == ev_id).first()


def get_event_day_by_date(db: Session, event_date: datetime.date) -> EventDay | None:
    return db.query(EventDay).filter(EventDay.event_date == event_date).first()


def create_event_day(db: Session, payload: EventDayCreate) -> EventDay:
    if payload.event_type == "NORMAL":
        raise ValueError("Ngày bình thường là ngày mặc định của hệ thống, không cần cài đặt sự kiện.")
    event = EventDay(**payload.model_dump())
    db.add(event)
    db.flush()
    db.commit()
    db.refresh(event)
    return event


def create_event_days_batch(
    db: Session, payload: EventDayCreateBatch
) -> list[EventDay]:
    if payload.event_type == "NORMAL":
        raise ValueError("Ngày bình thường là ngày mặc định của hệ thống, không cần cài đặt sự kiện.")
    s_date = payload.start_date or payload.end_date
    e_date = payload.end_date or payload.start_date
    if not s_date:
        raise ValueError("Vui lòng chọn Từ ngày hoặc Đến ngày")
    if s_date > e_date:
        s_date, e_date = e_date, s_date

    results: list[EventDay] = []
    curr = s_date
    while curr <= e_date:
        existing = db.query(EventDay).filter(EventDay.event_date == curr).first()
        if existing:
            existing.event_type = payload.event_type
            existing.notes = payload.notes
            results.append(existing)
        else:
            ev = EventDay(
                event_date=curr,
                event_type=payload.event_type,
                notes=payload.notes,
            )
            db.add(ev)
            results.append(ev)
        curr += datetime.timedelta(days=1)

    db.flush()
    db.commit()
    for item in results:
        db.refresh(item)
    return results


def update_event_day(
    db: Session, event_day: EventDay, payload: EventDayUpdate
) -> EventDay:
    if payload.event_type == "NORMAL":
        raise ValueError("Ngày bình thường là ngày mặc định của hệ thống, không cần cài đặt sự kiện.")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event_day, key, value)
    db.commit()
    db.refresh(event_day)
    return event_day


def delete_event_day(db: Session, event_day: EventDay) -> None:
    db.delete(event_day)
    db.commit()
