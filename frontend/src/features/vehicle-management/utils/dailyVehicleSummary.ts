import type { DailyOdometerLog, Vehicle, VehicleDispatch } from "../types";
import { calculateOvertime } from "./odometerUtils";

export interface DailyVehicleSummary {
  key: string;
  date: string;
  vehicle_id?: number;
  vehicle_name: string;
  license_plate?: string;
  start_km?: number;
  end_km?: number;
  daily_km?: number;
  pickup_time?: string;
  return_time?: string;
  overtime_hours?: number;
  notes?: string;
}

function validDistance(start?: number, end?: number): number | undefined {
  return start !== undefined && end !== undefined && end >= start ? end - start : undefined;
}

export function summarizeVehicleDays(dispatches: VehicleDispatch[], logs: DailyOdometerLog[], vehicles: Vehicle[]): DailyVehicleSummary[] {
  const vehicleId = (dispatch: VehicleDispatch): number | undefined => dispatch.vehicle_id ?? vehicles.find(vehicle => vehicle.name === dispatch.vehicle_name)?.id;
  const groups = new Map<string, VehicleDispatch[]>();
  for (const dispatch of dispatches) {
    const id = vehicleId(dispatch);
    const key = `${dispatch.dispatch_date}_${id ? `v_${id}` : dispatch.vehicle_name}`;
    const list = groups.get(key) || [];
    list.push(dispatch);
    groups.set(key, list);
  }
  const summaries = new Map<string, DailyVehicleSummary>();
  for (const [key, list] of groups) {
    const sorted = [...list].sort((a, b) => (a.pickup_time || "00:00").localeCompare(b.pickup_time || "00:00") || a.id - b.id);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const start = first.odometer_km ?? first.start_km ?? undefined;
    const end = last.end_km ?? last.odometer_km ?? (sorted.length === 1 ? start : undefined);
    const pickup = first.pickup_time || undefined;
    const returned = last.return_time || undefined;
    summaries.set(key, { key, date: first.dispatch_date, vehicle_id: vehicleId(first), vehicle_name: first.vehicle_name,
      license_plate: first.license_plate || undefined, start_km: start, end_km: end,
      daily_km: validDistance(start, end), pickup_time: pickup, return_time: returned,
      overtime_hours: pickup && returned ? calculateOvertime(first.dispatch_date, pickup, returned) : undefined });
  }
  for (const log of logs) {
    const key = `${log.log_date}_v_${log.vehicle_id}`;
    // Dispatches stay the primary source; a daily log fills days without dispatches.
    if (summaries.has(key)) continue;
    const start = log.start_km >= 0 ? log.start_km : undefined;
    const end = log.end_km >= 0 ? log.end_km : undefined;
    summaries.set(key, { key, date: log.log_date, vehicle_id: log.vehicle_id,
      vehicle_name: log.vehicle_name || vehicles.find(vehicle => vehicle.id === log.vehicle_id)?.name || `Xe #${log.vehicle_id}`,
      license_plate: log.license_plate || undefined, start_km: start, end_km: end,
      daily_km: validDistance(start, end) !== undefined ? log.daily_km : undefined, notes: log.notes || undefined });
  }
  return [...summaries.values()].sort((a, b) => b.date.localeCompare(a.date) || a.vehicle_name.localeCompare(b.vehicle_name, "vi"));
}
