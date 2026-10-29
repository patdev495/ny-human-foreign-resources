from __future__ import annotations

import datetime as dt

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Unicode, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class EndShiftReport(Base):
    __tablename__ = "end_shift_reports"
    __table_args__ = (
        UniqueConstraint("employee_id", "report_date", name="uq_end_shift_reports_employee_date"),
        {"implicit_returning": False},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    report_date: Mapped[dt.date] = mapped_column(Date, nullable=False, index=True)
    shift_choice: Mapped[str] = mapped_column(Unicode(20), nullable=False)
    pickup_location: Mapped[str | None] = mapped_column(Unicode(20), nullable=True)
    destination: Mapped[str] = mapped_column(Unicode(100), nullable=False, default="KTX")
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False, default=dt.datetime.now)
