from __future__ import annotations

import sys
from core.database import SessionLocal
from features.hr_foreign.models import ForeignEmployee


def seed_janitors() -> None:
    db = SessionLocal()

    janitors_data = [
        {
            'employee_code': 'NYV2007077',
            'name_latin': 'DO THI LAN',
            'name_chinese': 'Đỗ Thị Lan',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ CN09',
            'work_type': 'CO_DINH',
            'workplace_location': 'CN09',
            'salary': 8500000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ tháng 8,500,000đ - CN09'
        },
        {
            'employee_code': 'NYV2007078',
            'name_latin': 'TRAN THI HONG',
            'name_chinese': 'Trần Thị Hồng',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ CN09',
            'work_type': 'CO_DINH',
            'workplace_location': 'CN09',
            'salary': 8500000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ tháng 8,500,000đ - CN09'
        },
        {
            'employee_code': 'NYV2007079',
            'name_latin': 'NGUYEN THI DUYEN',
            'name_chinese': 'Nguyễn Thị Duyên',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ CN15',
            'work_type': 'CO_DINH',
            'workplace_location': 'CN15',
            'salary': 8500000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ tháng 8,500,000đ - CN15'
        },
        {
            'employee_code': 'NYV2007080',
            'name_latin': 'HOANG THI LAN',
            'name_chinese': 'Hoàng Thị Lan',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ CN15',
            'work_type': 'CO_DINH',
            'workplace_location': 'CN15',
            'salary': 8500000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ tháng 8,500,000đ - CN15'
        },
        {
            'employee_code': 'NYV2007081',
            'name_latin': 'VU THI OANH',
            'name_chinese': 'Vũ Thị Oanh',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ KTX',
            'work_type': 'CO_DINH',
            'workplace_location': 'DORMITORY',
            'salary': 8000000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ tháng 8,000,000đ - KTX'
        },
        {
            'employee_code': 'NYV232308005',
            'name_latin': 'BUI THI LAN',
            'name_chinese': 'Bùi Thị Lan',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ KTX thuê ngoài',
            'work_type': 'CO_DINH',
            'workplace_location': 'DORMITORY',
            'salary': 13500000.0,
            'salary_unit': 'MONTH',
            'notes': 'Lương tạp vụ thuê ngoài tháng 13,500,000đ - KTX'
        },
        {
            'employee_code': 'NYV2007082',
            'name_latin': 'NGUYEN THI THU',
            'name_chinese': 'Nguyễn Thị Thứ',
            'gender': 'Nữ',
            'nationality': 'Việt Nam',
            'department': 'Nhân Sự/管理课',
            'role': 'Tạp vụ KTX',
            'work_type': 'CO_DINH',
            'workplace_location': 'DORMITORY',
            'salary': 70000.0,
            'salary_unit': 'DAY',
            'notes': 'Lương tạp vụ tính theo ngày công (70,000đ/ngày) - KTX'
        }
    ]

    for j in janitors_data:
        emp = db.query(ForeignEmployee).filter(
            (ForeignEmployee.employee_code == j['employee_code']) | 
            (ForeignEmployee.name_chinese == j['name_chinese'])
        ).first()
        
        if not emp:
            emp = ForeignEmployee(**j)
            db.add(emp)
        else:
            emp.name_latin = j['name_latin']
            emp.name_chinese = j['name_chinese']
            emp.department = j['department']
            emp.role = j['role']
            emp.workplace_location = j['workplace_location']
            emp.salary = j['salary']
            emp.notes = j['notes']

    db.flush()
    db.commit()
    db.close()


if __name__ == '__main__':
    seed_janitors()
    print("Janitor seeding complete.")
