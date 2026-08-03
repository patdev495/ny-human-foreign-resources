import type { VehicleDispatch } from "../types";

export interface OdoTripInfo {
  isFirstOfDay: boolean;
  isLastOfDay: boolean;
  isMissingRequiredOdo: boolean;
  isMissingRequiredTime: boolean;
  warningMessage?: string;
}

/**
 * Calculates contract overtime hours for a given day.
 * Standard hours:
 * - Sunday: 07:30 -> 18:00
 * - Weekdays / Sat: 07:00 -> 18:00
 */
export function calculateOvertime(dateStr: string, startTimeStr?: string, endTimeStr?: string): number {
  if (!startTimeStr || !endTimeStr) return 0;

  const dateObj = new Date(dateStr);
  const isSunday = dateObj.getDay() === 0;

  const stdStartMins = isSunday ? 7 * 60 + 30 : 7 * 60; // 07:30 or 07:00
  const stdEndMins = 18 * 60; // 18:00

  const parseMins = (tStr: string) => {
    const parts = tStr.split(":");
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const startMins = parseMins(startTimeStr);
  const endMins = parseMins(endTimeStr);

  if (startMins === null || endMins === null) return 0;

  const earlyOT = Math.max(0, (stdStartMins - startMins) / 60);
  const lateOT = Math.max(0, (endMins - stdEndMins) / 60);

  return Math.round((earlyOT + lateOT) * 10) / 10;
}

/**
 * Analyzes company dispatches grouped by vehicle and date to automatically identify
 * the First Trip of the Day (earliest pickup_time) and Last Trip of the Day (latest pickup_time).
 * Flags missing Odometer & missing Time warnings for First and Last trips.
 */
export function analyzeDailyDispatches(dispatches: VehicleDispatch[]): Map<number, OdoTripInfo> {
  const map = new Map<number, OdoTripInfo>();

  // Group company dispatches by date + vehicle (using vehicle_id or vehicle_name)
  const groups = new Map<string, VehicleDispatch[]>();
  for (const d of dispatches) {
    if (d.ownership_group !== "COMPANY_OWNED") continue;
    const vehicleKey = d.vehicle_id ? `v_${d.vehicle_id}` : d.vehicle_name;
    const key = `${d.dispatch_date}_${vehicleKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  for (const [, list] of groups.entries()) {
    // Sort by pickup_time ascending, then by id ascending
    const sorted = [...list].sort((a, b) => {
      const timeA = a.pickup_time || "00:00";
      const timeB = b.pickup_time || "00:00";
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return a.id - b.id;
    });

    const firstId = sorted[0].id;
    const lastId = sorted[sorted.length - 1].id;

    for (const d of list) {
      const isFirst = d.id === firstId;
      const isLast = d.id === lastId;
      const hasOdo =
        (d.odometer_km !== undefined && d.odometer_km !== null) ||
        (d.start_km !== undefined && d.start_km !== null) ||
        (d.end_km !== undefined && d.end_km !== null);

      const hasPickupTime = !!d.pickup_time;
      const hasReturnTime = !!d.return_time;

      let isMissingOdo = false;
      let isMissingTime = false;
      const warnings: string[] = [];

      if (isFirst) {
        if (!hasPickupTime) {
          isMissingTime = true;
          warnings.push("Thiếu Giờ đón chuyến đầu");
        }
        if (!hasOdo) {
          isMissingOdo = true;
          warnings.push("Thiếu Đồng hồ chuyến đầu");
        }
      }

      if (isLast) {
        if (!hasReturnTime) {
          isMissingTime = true;
          warnings.push("Thiếu Giờ về chuyến cuối");
        }
        if (!hasOdo) {
          isMissingOdo = true;
          warnings.push("Thiếu Đồng hồ chuyến cuối");
        }
      }

      map.set(d.id, {
        isFirstOfDay: isFirst,
        isLastOfDay: isLast,
        isMissingRequiredOdo: isMissingOdo,
        isMissingRequiredTime: isMissingTime,
        warningMessage: warnings.length > 0 ? `⚠️ ${warnings.join(" & ")}` : undefined,
      });
    }
  }

  return map;
}
