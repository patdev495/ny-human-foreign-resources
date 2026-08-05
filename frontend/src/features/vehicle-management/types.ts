export const OWNERSHIP_GROUPS = {
  COMPANY_OWNED: "COMPANY_OWNED",
  OUTSOURCED: "OUTSOURCED",
} as const;

export type OwnershipGroup = "COMPANY_OWNED" | "OUTSOURCED";
export type RouteType = "FIXED_ROUTE" | "KM_BASED";

export interface VehicleProvider {
  id: number;
  name: string;
  provider_type: OwnershipGroup;
  phone?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VendorRoute {
  id: number;
  provider_id: number;
  purpose?: string | null;
  pickup_location: string;
  dropoff_location: string;
  seat_type: string;
  fixed_price: number;
  waiting_fee_per_hour: number;
  is_two_way_same_price: boolean;
  notes?: string | null;
  created_at: string;
}

export interface CalculateCostRequest {
  provider_id?: number | null;
  vendor_route_id?: number | null;
  route_type: RouteType;
  seat_type?: string;
  distance_km: number;
  waiting_hours: number;
}

export interface CalculateCostResponse {
  base_cost: number;
  waiting_cost: number;
  total_calculated_cost: number;
}

export interface Vehicle {
  id: number;
  provider_id?: number | null;
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
  provider_id?: number | null;
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
  provider_id?: number | null;
  provider_name?: string | null;
  vehicle_id?: number | null;
  vehicle_name: string;
  ownership_group: OwnershipGroup;
  driver_name?: string | null;
  license_plate?: string | null;
  driver_phone?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  pickup_time?: string | null;
  return_time?: string | null;
  passenger_name?: string | null;
  passenger_count: number;
  
  start_km?: number | null;
  end_km?: number | null;
  odometer_km?: number | null;

  vendor_route_id?: number | null;
  route_type?: RouteType;
  distance_km?: number;
  waiting_hours?: number;
  calculated_cost?: number;
  cost: number;
  toll_fee?: number;
  meal_count?: number;
  overnight_count?: number;
  notes?: string | null;
  created_at: string;
}


export interface VehicleDispatchCreatePayload {
  dispatch_date: string;
  provider_id?: number | null;
  provider_name?: string | null;
  vehicle_id?: number | null;
  vehicle_name: string;
  ownership_group: OwnershipGroup;
  driver_name?: string | null;
  license_plate?: string | null;
  driver_phone?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  pickup_time?: string | null;
  return_time?: string | null;
  passenger_name?: string | null;
  passenger_count: number;

  start_km?: number | null;
  end_km?: number | null;
  odometer_km?: number | null;
  
  vendor_route_id?: number | null;
  route_type?: RouteType;
  distance_km?: number;
  waiting_hours?: number;
  calculated_cost?: number;
  cost: number;
  toll_fee?: number;
  meal_count?: number;
  overnight_count?: number;
  notes?: string | null;
}


export interface MonthlyVehicleContract {
  id: number;
  vehicle_id: number;
  vehicle_name?: string | null;
  license_plate?: string | null;
  contract_name: string;
  base_monthly_cost: number;
  km_allowance: number;
  excess_km_rate: number;
  standard_start_time: string;
  standard_end_time: string;
  sunday_standard_start_time?: string;
  sunday_standard_end_time?: string;
  evening_fixed_bonus_start?: string | null;
  evening_fixed_bonus_end?: string | null;
  evening_fixed_bonus_amount: number;
  overtime_rate_weekday: number;
  overtime_rate_weekend: number;
  sunday_daily_rate: number;
  holiday_daily_rate: number;
  overnight_fee: number;
  meal_allowance_fee: number;
  notes?: string | null;
  created_at: string;
}

export interface DailyOdometerLog {
  id: number;
  vehicle_id: number;
  vehicle_name?: string | null;
  license_plate?: string | null;
  log_date: string;
  start_km: number;
  end_km: number;
  daily_km: number;
  start_photo_url?: string | null;
  end_photo_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface DailyOdometerLogCreatePayload {
  vehicle_id: number;
  log_date: string;
  start_km: number;
  end_km: number;
  start_photo_url?: string | null;
  end_photo_url?: string | null;
  notes?: string | null;
}

export interface MonthlyReconciliationItem {
  vehicle_id: number;
  vehicle_name: string;
  license_plate?: string | null;
  contract_name: string;
  base_monthly_cost: number;
  km_allowance: number;
  excess_km_rate: number;
  total_month_km: number;
  excess_km: number;
  excess_km_cost: number;
  overtime_hours: number;
  overtime_cost: number;
  surcharges_cost: number;
  total_cost: number;
}


