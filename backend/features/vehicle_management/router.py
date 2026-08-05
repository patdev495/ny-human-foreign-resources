from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from features.vehicle_management import service
from features.vehicle_management.models import OwnershipGroup
from features.vehicle_management.schemas import (
    CalculateCostRequest,
    CalculateCostResponse,
    DailyOdometerLogCreate,
    DailyOdometerLogResponse,
    MonthlyReconciliationItemResponse,
    MonthlyVehicleContractResponse,
    MonthlyVehicleContractUpdate,
    VehicleCreate,
    VehicleDispatchCreate,
    VehicleDispatchResponse,
    VehicleDispatchUpdate,
    VehicleProviderResponse,
    VehicleResponse,
    VehicleUpdate,
    VendorRouteResponse,
)

router = APIRouter(prefix="/api/vehicle-management", tags=["Vehicle Management"])


# --- Vehicle Provider & Route Routes ---

@router.get("/providers", response_model=List[VehicleProviderResponse])
def list_providers(db: Session = Depends(get_db)):
    return service.get_providers(db)


@router.get("/vendor-routes", response_model=List[VendorRouteResponse])
def list_vendor_routes(
    provider_id: Optional[int] = Query(None, description="Filter by Provider ID"),
    db: Session = Depends(get_db),
):
    return service.get_vendor_routes(db, provider_id=provider_id)


@router.post("/calculate-cost", response_model=CalculateCostResponse)
def calculate_cost(
    req: CalculateCostRequest,
    db: Session = Depends(get_db),
):
    return service.calculate_dispatch_cost(db, req)


# --- Vehicle Catalog Routes ---

@router.get("/vehicles", response_model=List[VehicleResponse])
def list_vehicles(
    ownership_group: Optional[OwnershipGroup] = None,
    db: Session = Depends(get_db),
):
    return service.get_vehicles(db, ownership_group=ownership_group)


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
):
    return service.create_vehicle(db, vehicle_in)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
):
    vehicle = service.update_vehicle(db, vehicle_id, vehicle_in)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    success = service.delete_vehicle(db, vehicle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}


# --- Vehicle Dispatch Routes ---

@router.get("/dispatches", response_model=List[VehicleDispatchResponse])
def list_dispatches(
    from_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    ownership_group: Optional[OwnershipGroup] = None,
    provider_id: Optional[int] = Query(None, description="Filter by Provider ID"),
    billing_month: Optional[str] = Query(None, description="Format: YYYY-MM (e.g. 2026-05)"),
    search: Optional[str] = Query(None, description="Search by name, driver, or locations"),
    db: Session = Depends(get_db),
):
    return service.get_dispatches(
        db,
        from_date=from_date,
        to_date=to_date,
        ownership_group=ownership_group,
        provider_id=provider_id,
        billing_month=billing_month,
        search=search,
    )


@router.post("/dispatches", response_model=VehicleDispatchResponse, status_code=status.HTTP_201_CREATED)
def create_dispatch(
    dispatch_in: VehicleDispatchCreate,
    db: Session = Depends(get_db),
):
    return service.create_dispatch(db, dispatch_in)


@router.put("/dispatches/{dispatch_id}", response_model=VehicleDispatchResponse)
def update_dispatch(
    dispatch_id: int,
    dispatch_in: VehicleDispatchUpdate,
    db: Session = Depends(get_db),
):
    dispatch = service.update_dispatch(db, dispatch_id, dispatch_in)
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch record not found")
    return dispatch


@router.delete("/dispatches/{dispatch_id}")
def delete_dispatch(
    dispatch_id: int,
    db: Session = Depends(get_db),
):
    success = service.delete_dispatch(db, dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch record not found")
    return {"message": "Dispatch record deleted successfully"}


# --- Monthly Contract & Odometer Log Routes ---

@router.get("/contracts", response_model=List[MonthlyVehicleContractResponse])
def list_monthly_contracts(db: Session = Depends(get_db)):
    return service.get_monthly_contracts(db)


@router.put("/contracts/{contract_id}", response_model=MonthlyVehicleContractResponse)
def update_monthly_contract(
    contract_id: int,
    contract_in: MonthlyVehicleContractUpdate,
    db: Session = Depends(get_db),
):
    updated = service.update_monthly_contract(db, contract_id, contract_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Monthly contract not found")
    return updated


@router.get("/odometer-logs", response_model=List[DailyOdometerLogResponse])
def list_daily_odometer_logs(
    vehicle_id: Optional[int] = Query(None, description="Filter by Vehicle ID"),
    from_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    billing_month: Optional[str] = Query(None, description="Format: YYYY-MM (e.g. 2026-05)"),
    db: Session = Depends(get_db),
):
    return service.get_daily_odometer_logs(
        db, vehicle_id=vehicle_id, from_date=from_date, to_date=to_date, billing_month=billing_month
    )


@router.post("/odometer-logs", response_model=DailyOdometerLogResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_daily_odometer_log(
    log_in: DailyOdometerLogCreate,
    db: Session = Depends(get_db),
):
    return service.create_or_update_daily_odometer_log(db, log_in)


@router.get("/reports/monthly-reconciliation", response_model=List[MonthlyReconciliationItemResponse])
def get_monthly_reconciliation_report(
    billing_month: str = Query(..., description="Format: YYYY-MM (e.g. 2026-05)"),
    db: Session = Depends(get_db),
):
    return service.get_monthly_reconciliation_report(db, billing_month=billing_month)


@router.get("/export-excel")
def export_vehicle_excel(
    provider_type: str = Query("COMPANY_OWNED", description="COMPANY_OWNED or OUTSOURCED"),
    from_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    from fastapi.responses import StreamingResponse
    from features.vehicle_management.services.excel_service import (
        generate_duc_anh_excel_report,
        generate_binh_an_excel_report,
    )

    today = datetime.now().strftime("%Y-%m-%d")
    f_date = from_date or f"{today[:7]}-01"
    t_date = to_date or today

    if provider_type == "COMPANY_OWNED":
        excel_io = generate_duc_anh_excel_report(db, f_date, t_date)
        filename = f"Bao_Cao_3_Xe_Duc_Anh_{f_date}_den_{t_date}.zip"
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
        return StreamingResponse(
            excel_io,
            media_type="application/zip",
            headers=headers,
        )
    else:
        excel_io = generate_binh_an_excel_report(db, f_date, t_date)
        filename = f"Bang_Ke_Chuyen_Xe_Binh_An_{f_date}_den_{t_date}.xlsx"
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
        return StreamingResponse(
            excel_io,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )



@router.get("/contracts/pdf/{doc_key}")
def get_contract_pdf(doc_key: str):
    import os
    from fastapi.responses import Response

    base_dir = os.path.dirname(os.path.abspath(__file__))
    hd_dir = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "HD"))

    if not os.path.exists(hd_dir):
        raise HTTPException(status_code=404, detail="Thư mục HD chứa file hợp đồng không tồn tại")

    files = os.listdir(hd_dir)
    target_filename = None

    key_keywords = {
        "7_seater": ["7seat", "7_seat", "7 chỗ", "7_seater", "innova"],
        "truck": ["xetai", "truck", "xe tải", "tải"],
        "binh_an": ["binhan", "binh_an", "hđbinhan"],
    }

    # 1. Direct filename match
    for f in files:
        if f.lower() == doc_key.lower() or f.lower() == f"{doc_key.lower()}.pdf":
            target_filename = f
            break

    # 2. Key keywords match
    if not target_filename:
        keywords = key_keywords.get(doc_key, [doc_key.lower()])
        for f in files:
            f_lower = f.lower()
            if any(kw in f_lower for kw in keywords):
                target_filename = f
                break

    if not target_filename:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file hợp đồng trong hệ thống ({doc_key})")

    file_path = os.path.join(hd_dir, target_filename)

    try:
        with open(file_path, "rb") as f:
            content = f.read()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Không thể đọc file hợp đồng: {str(err)}")

    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "no-cache",
        },
    )



