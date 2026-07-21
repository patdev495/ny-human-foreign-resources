from __future__ import annotations

import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    Unicode,
    UnicodeText,
)
from sqlalchemy.orm import relationship

from core.database import Base


class ForeignEmployee(Base):
    __tablename__ = "foreign_employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name_latin = Column(Unicode(255), nullable=False, index=True)
    name_chinese = Column(Unicode(255), nullable=True)
    gender = Column(Unicode(50), nullable=False)
    nationality = Column(Unicode(100), nullable=True)  # Nullable if missing in Excel
    date_of_birth = Column(Date, nullable=True)
    passport_number = Column(Unicode(100), nullable=True, index=True)  # Nullable if missing in Excel
    passport_expiry = Column(Date, nullable=True)
    required_exit_date = Column(Date, nullable=True)  # NGÀY PHẢI VỀ NƯỚC (từ Excel KTX)
    phone = Column(Unicode(100), nullable=True)
    department = Column(Unicode(100), nullable=True)  # Nullable if missing in Excel
    role = Column(Unicode(100), nullable=True)
    notes = Column(UnicodeText, nullable=True)

    stays = relationship("Stay", back_populates="employee", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_number = Column(Unicode(100), nullable=False, unique=True, index=True)
    notes = Column(UnicodeText, nullable=True)

    stays = relationship("Stay", back_populates="room")


class Stay(Base):
    __tablename__ = "stays"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    accommodation_type = Column(Unicode(50), nullable=False, default="KTX")  # KTX, HOTEL
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    bed_location = Column(Unicode(50), nullable=True)  # Vị trí giường (A, B, 2 giường...) từ Excel
    stay_type = Column(Unicode(50), nullable=False, default="CO_DINH")  # CO_DINH, CONG_TAC
    has_meals = Column(Boolean, nullable=False, default=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    notes = Column(UnicodeText, nullable=True)

    employee = relationship("ForeignEmployee", back_populates="stays")
    room = relationship("Room", back_populates="stays")
    visas = relationship("Visa", back_populates="stay", cascade="all, delete-orphan")
    tam_trus = relationship("TamTru", back_populates="stay", cascade="all, delete-orphan")
    meal_absences = relationship("MealAbsence", back_populates="stay", cascade="all, delete-orphan")


class Visa(Base):
    __tablename__ = "visas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    visa_type = Column(Unicode(100), nullable=False)  # DN1, LD2, DT1...
    entry_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    notes = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="visas")


class TamTru(Base):
    __tablename__ = "tam_trus"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    registration_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    notes = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="tam_trus")


class MealAbsence(Base):
    __tablename__ = "meal_absences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    absence_date = Column(Date, nullable=False)
    reason = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="meal_absences")


class EventDay(Base):
    __tablename__ = "event_days"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_date = Column(Date, nullable=False, unique=True, index=True)
    event_type = Column(Unicode(100), nullable=False, default="PRESIDENT_VISIT")
    notes = Column(UnicodeText, nullable=True)


class MealPriceConfig(Base):
    __tablename__ = "meal_price_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    day_type = Column(Unicode(100), nullable=False)  # NORMAL, PRESIDENT_VISIT
    price_per_meal = Column(Float, nullable=False)
    effective_from = Column(Date, nullable=False, default=datetime.date(2020, 1, 1))
