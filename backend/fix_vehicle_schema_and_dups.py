# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from sqlalchemy import text
from core.database import engine, SessionLocal
from features.vehicle_management.models import VehicleProvider, VendorRoute, Vehicle

def fix_schema_and_dups():
    with engine.begin() as conn:
        # 1. Check vehicle_dispatches
        cols_disp = [r[0] for r in conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vehicle_dispatches'"))]
        missing_disp_cols = [
            ("provider_id", "INT NULL"),
            ("provider_name", "NVARCHAR(200) NULL"),
            ("vendor_route_id", "INT NULL"),
            ("route_type", "NVARCHAR(50) NOT NULL DEFAULT 'FIXED_ROUTE'"),
            ("distance_km", "FLOAT NOT NULL DEFAULT 0.0"),
            ("waiting_hours", "FLOAT NOT NULL DEFAULT 0.0"),
            ("calculated_cost", "FLOAT NOT NULL DEFAULT 0.0"),
        ]
        for col_name, col_def in missing_disp_cols:
            if col_name not in cols_disp:
                print(f"Adding column {col_name} to vehicle_dispatches...")
                conn.execute(text(f"ALTER TABLE vehicle_dispatches ADD {col_name} {col_def}"))

        # 2. Check vehicles
        cols_veh = [r[0] for r in conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vehicles'"))]
        missing_veh_cols = [
            ("provider_id", "INT NULL"),
        ]
        for col_name, col_def in missing_veh_cols:
            if col_name not in cols_veh:
                print(f"Adding column {col_name} to vehicles...")
                conn.execute(text(f"ALTER TABLE vehicles ADD {col_name} {col_def}"))

    # Now clean up duplicate providers in vehicle_providers via raw SQL to avoid ORM relationship issues
    with engine.begin() as conn:
        providers = conn.execute(text("SELECT id, name FROM vehicle_providers ORDER BY id")).fetchall()
        seen = {}
        for pid, name in providers:
            if name in seen:
                canonical_id = seen[name]
                print(f"Deleting duplicate provider id={pid}, name={name} (canonical={canonical_id})")
                conn.execute(text(f"UPDATE vendor_routes SET provider_id = {canonical_id} WHERE provider_id = {pid}"))
                conn.execute(text(f"UPDATE vehicles SET provider_id = {canonical_id} WHERE provider_id = {pid}"))
                conn.execute(text(f"UPDATE vehicle_dispatches SET provider_id = {canonical_id} WHERE provider_id = {pid}"))
                conn.execute(text(f"DELETE FROM vehicle_providers WHERE id = {pid}"))
            else:
                seen[name] = pid
        print("Deduplication completed successfully!")

if __name__ == "__main__":
    fix_schema_and_dups()
