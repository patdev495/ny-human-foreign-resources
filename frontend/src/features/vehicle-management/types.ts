export const OWNERSHIP_GROUPS = {
  COMPANY_OWNED: "COMPANY_OWNED",
  OUTSOURCED: "OUTSOURCED",
} as const;

export type OwnershipGroup = "COMPANY_OWNED" | "OUTSOURCED";


export interface Vehicle {
  id: number;
  ownership_group: OwnershipGroup;
  name: string;
  driver_name?: string | null;
  license_plate?: string | null;
  driver_phone?: string | null;
  default_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface VehicleCreatePayload {
  ownership_group: OwnershipGroup;
  name: string;
  driver_name?: string | null;
  license_plate?: string | null;
  driver_phone?: string | null;
  default_cost: number;
  is_active?: boolean;
}

export interface VehicleDispatch {
  id: number;
  dispatch_date: string;
  vehicle_id?: number | null;
  vehicle_name: string;
  ownership_group: OwnershipGroup;
  driver_name?: string | null;
  license_plate?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  pickup_time?: string | null;
  passenger_name?: string | null;
  passenger_count: number;
  cost: number;
  notes?: string | null;
  created_at: string;
}

export interface VehicleDispatchCreatePayload {
  dispatch_date: string;
  vehicle_id?: number | null;
  vehicle_name: string;
  ownership_group: OwnershipGroup;
  driver_name?: string | null;
  license_plate?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  pickup_time?: string | null;
  passenger_name?: string | null;
  passenger_count: number;
  cost: number;
  notes?: string | null;
}
