import type { VehicleDispatch, VehicleDispatchCreatePayload } from "../../types";

export function dispatchToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function dispatchPayload(dispatch: VehicleDispatch): VehicleDispatchCreatePayload {
  const { id: _id, created_at: _createdAt, ...payload } = dispatch;
  return payload;
}

export function emptyDispatch(): VehicleDispatchCreatePayload {
  return {
    dispatch_date: dispatchToday(), vehicle_name: "", ownership_group: "OUTSOURCED",
    driver_name: "", license_plate: "", driver_phone: "", pickup_location: "", dropoff_location: "",
    pickup_time: "08:00", passenger_name: "", passenger_count: 1, route_type: "FIXED_ROUTE",
    distance_km: 0, waiting_hours: 0, calculated_cost: 0, cost: 0, notes: "",
  };
}
