from __future__ import annotations

import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Unicode,
    UnicodeText,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from core.database import Base


class ForeignEmployee(Base):
    __tablename__ = "foreign_employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_code = Column(Unicode(50), nullable=True, unique=True, index=True)  # Mã nhân viên (NY...)
    name_latin = Column(Unicode(255), nullable=False, index=True)
    name_chinese = Column(Unicode(255), nullable=True)
    gender = Column(Unicode(50), nullable=False)
    nationality = Column(Unicode(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    passport_number = Column(Unicode(100), nullable=True, index=True)
    passport_expiry = Column(Date, nullable=True)
    entry_date = Column(Date, nullable=True)           # NGÀY ĐẾN VIỆT NAM
    expected_entry_date = Column(Date, nullable=True)  # NGÀY DỰ KIẾN SANG VIỆT NAM
    expected_exit_date = Column(Date, nullable=True)   # NGÀY DỰ KIẾN VỀ NƯỚC
    actual_exit_date = Column(Date, nullable=True)     # NGÀY THỰC TẾ ĐÃ VỀ NƯỚC
    required_exit_date = Column(Date, nullable=True)  # NGÀY PHẢI VỀ NƯỚC (từ Excel KTX / legacy)
    phone = Column(Unicode(100), nullable=True)
    department = Column(Unicode(100), nullable=True)  # Vị trí công việc (Lao động kỹ thuật, Giám đốc...)
    role = Column(Unicode(255), nullable=True)         # Chức danh công việc chi tiết
    work_type = Column(Unicode(50), nullable=False, default="CO_DINH")  # CO_DINH, CONG_TAC
    notes = Column(UnicodeText, nullable=True)

    stays = relationship("Stay", back_populates="employee", cascade="all, delete-orphan")
    work_permits = relationship("WorkPermit", back_populates="employee", cascade="all, delete-orphan", order_by="WorkPermit.valid_from")
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan", order_by="Contract.start_date")
    travel_records = relationship("TravelRecord", back_populates="employee", cascade="all, delete-orphan", order_by="TravelRecord.entry_date")


class TravelRecord(Base):
    """Lịch sử các đợt sang Việt Nam của nhân sự nước ngoài."""
    __tablename__ = "travel_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    entry_date = Column(Date, nullable=True)           # Ngày đến Việt Nam
    expected_entry_date = Column(Date, nullable=True)  # Ngày dự kiến sang Việt Nam đợt tiếp theo
    expected_exit_date = Column(Date, nullable=True)   # Ngày dự kiến về nước
    actual_exit_date = Column(Date, nullable=True)     # Ngày thực tế đã về (NULL = đang ở VN)
    notes = Column(UnicodeText, nullable=True)

    employee = relationship("ForeignEmployee", back_populates="travel_records")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_number = Column(Unicode(100), nullable=False, unique=True, index=True)
    notes = Column(UnicodeText, nullable=True)

    stays = relationship("Stay", back_populates="room")


class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(Unicode(255), nullable=False, index=True)
    address = Column(Unicode(255), nullable=True)
    phone = Column(Unicode(100), nullable=True)
    notes = Column(UnicodeText, nullable=True)

    stays = relationship("Stay", back_populates="hotel")


class Stay(Base):
    __tablename__ = "stays"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    accommodation_type = Column(Unicode(50), nullable=False, default="KTX")  # KTX, HOTEL
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True, index=True)
    hotel_room_number = Column(Unicode(100), nullable=True)  # Số phòng tại khách sạn (vd: P201)
    bed_location = Column(Unicode(50), nullable=True)  # Vị trí giường (A, B, 2 giường...) từ Excel
    stay_type = Column(Unicode(50), nullable=False, default="CO_DINH")  # CO_DINH, CONG_TAC
    has_meals = Column(Boolean, nullable=False, default=True)
    start_date = Column(Date, nullable=True)
    expected_end_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(UnicodeText, nullable=True)

    employee = relationship("ForeignEmployee", back_populates="stays")
    room = relationship("Room", back_populates="stays")
    hotel = relationship("Hotel", back_populates="stays")
    visas = relationship("Visa", back_populates="stay", cascade="all, delete-orphan")
    tam_trus = relationship("TamTru", back_populates="stay", cascade="all, delete-orphan")
    meal_absences = relationship("MealAbsence", back_populates="stay", cascade="all, delete-orphan")


class Visa(Base):
    __tablename__ = "visas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    visa_type = Column(Unicode(100), nullable=True)  # DN1, LD2, DT1...
    entry_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    notes = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="visas")


class TamTru(Base):
    __tablename__ = "tam_trus"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    registration_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    notes = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="tam_trus")


class MealAbsence(Base):
    __tablename__ = "meal_absences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    stay_id = Column(Integer, ForeignKey("stays.id"), nullable=False, index=True)
    absence_date = Column(Date, nullable=False)
    meal_type = Column(Unicode(50), nullable=False, default="ALL_DAY")  # BREAKFAST, DINNER, ALL_DAY
    reason = Column(UnicodeText, nullable=True)

    stay = relationship("Stay", back_populates="meal_absences")


class EventDay(Base):
    __tablename__ = "event_days"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_date = Column(Date, nullable=False, unique=True, index=True)
    event_type = Column(Unicode(100), nullable=False, default="PRESIDENT_VISIT")
    notes = Column(UnicodeText, nullable=True)


class WorkPermit(Base):
    """Giấy phép lao động (GPLĐ) của Nhân viên nước ngoài."""
    __tablename__ = "work_permits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    permit_number = Column(Unicode(150), nullable=True)   # Số GPLĐ
    issue_date = Column(Date, nullable=True)              # Ngày cấp
    valid_from = Column(Date, nullable=True)              # Từ ngày
    valid_to = Column(Date, nullable=True)                # Đến ngày
    issue_type = Column(Unicode(150), nullable=True)      # CẤP MỚI / CẤP LẠI / GIA HẠN / ...
    notes = Column(UnicodeText, nullable=True)

    employee = relationship("ForeignEmployee", back_populates="work_permits")


class Contract(Base):
    """Hợp đồng lao động của Nhân viên nước ngoài. Một nhân viên có thể có nhiều HĐ nối tiếp."""
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("foreign_employees.id"), nullable=False, index=True)
    contract_number = Column(Unicode(150), nullable=True) # Số HĐLĐ (HDLD-...)
    contract_type = Column(Unicode(50), nullable=True)   # Cấp mới / Gia hạn / Cấp lại
    start_date = Column(Date, nullable=True)              # Ngày ký / bắt đầu
    end_date = Column(Date, nullable=True)                # Ngày hết hạn
    notes = Column(UnicodeText, nullable=True)            # Ghi chú (trạng thái, lý do...)


    employee = relationship("ForeignEmployee", back_populates="contracts")


class MealPriceConfig(Base):
    __tablename__ = "meal_price_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    day_type = Column(Unicode(100), nullable=False)  # NORMAL, PRESIDENT_VISIT, TET...
    day_type_name = Column(Unicode(255), nullable=True)  # Ngày bình thường, Chủ tịch sang...
    foreign_breakfast_price = Column(Float, nullable=False, default=30000.0)
    foreign_dinner_price = Column(Float, nullable=False, default=40000.0)
    janitor_meal_price = Column(Float, nullable=False, default=25000.0)
    effective_from = Column(Date, nullable=False, default=datetime.date(2020, 1, 1))
    notes = Column(UnicodeText, nullable=True)



class DocumentAttachment(Base):
    """Tệp đính kèm hình ảnh/PDF cho các loại giấy tờ (PASSPORT, VISA, TAM_TRU, WORK_PERMIT, CONTRACT)."""
    __tablename__ = "document_attachments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_type = Column(Unicode(50), nullable=False, index=True)  # PASSPORT, VISA, TAM_TRU, WORK_PERMIT, CONTRACT
    entity_id = Column(Integer, nullable=False, index=True)
    file_name = Column(Unicode(255), nullable=False)
    file_path = Column(Unicode(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(Unicode(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.now)


class DocWarningConfig(Base):
    """Cấu hình mốc cảnh báo hết hạn cho 5 loại giấy tờ (VISA, TAM_TRU, GPLD, CONTRACT, PASSPORT)."""
    __tablename__ = "doc_warning_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doc_type = Column(Unicode(50), nullable=False, unique=True, index=True)
    warning_value = Column(Integer, nullable=False, default=30)
    warning_unit = Column(Unicode(20), nullable=False, default="DAY")  # DAY, MONTH


class MealSessionLock(Base):
    """Bản ghi đóng băng (Snapshot) số lượng và đơn giá cho từng bữa ăn (BREAKFAST, DINNER)."""
    __tablename__ = "meal_session_locks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lock_date = Column(Date, nullable=False, index=True)
    meal_session = Column(Unicode(50), nullable=False)  # BREAKFAST, DINNER
    calculated_meal_count = Column(Integer, nullable=False, default=0)
    final_meal_count = Column(Integer, nullable=False, default=0)
    locked_price_per_meal = Column(Float, nullable=False, default=30000.0)
    locked_at = Column(DateTime, nullable=False, default=datetime.datetime.now)
    locked_by = Column(Unicode(255), nullable=True)
    notes = Column(UnicodeText, nullable=True)

    __table_args__ = (
        UniqueConstraint("lock_date", "meal_session", name="uq_meal_session_locks_date_session"),
    )


