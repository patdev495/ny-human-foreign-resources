import type {
  DailyMealForecastResponse,
  DailyPresenceReportResponse,
  EventDay,
  EventDayCreate,
  EventDayCreateBatch,
  MealAbsence,
  MealAbsenceCreate,
  MealExpenseReportResponse,
  MealPriceConfig,
  MealPriceConfigCreate,
  MealSessionLock,
  MealSessionLockCreate,
} from "../types";
import { BASE, formatApiError } from "./apiUtils";

export async function fetchMealAbsences(stayId: number): Promise<MealAbsence[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/meal-absences`);
  if (!res.ok) throw new Error("Failed to fetch meal absences");
  return res.json() as Promise<MealAbsence[]>;
}

export async function createMealAbsence(
  stayId: number,
  payload: MealAbsenceCreate
): Promise<MealAbsence> {
  const res = await fetch(`${BASE}/stays/${stayId}/meal-absences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create meal absence");
  return res.json() as Promise<MealAbsence>;
}

export async function deleteMealAbsence(id: number): Promise<void> {
  const res = await fetch(`${BASE}/meal-absences/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal absence");
}

export async function fetchEventDays(): Promise<EventDay[]> {
  const res = await fetch(`${BASE}/event-days`);
  if (!res.ok) throw new Error("Failed to fetch event days");
  return res.json() as Promise<EventDay[]>;
}

export async function createEventDay(payload: EventDayCreate): Promise<EventDay> {
  const res = await fetch(`${BASE}/event-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create event day");
  }
  return res.json() as Promise<EventDay>;
}

export async function createEventDaysBatch(
  payload: EventDayCreateBatch
): Promise<EventDay[]> {
  const res = await fetch(`${BASE}/event-days/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to create event days batch"));
  }
  return res.json() as Promise<EventDay[]>;
}

export async function deleteEventDay(id: number): Promise<void> {
  const res = await fetch(`${BASE}/event-days/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event day");
}

export async function updateEventDay(
  id: number,
  payload: Partial<EventDay>
): Promise<EventDay> {
  const res = await fetch(`${BASE}/event-days/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to update event day"));
  }
  return res.json() as Promise<EventDay>;
}

export async function fetchMealPriceConfigs(): Promise<MealPriceConfig[]> {
  const res = await fetch(`${BASE}/meal-price-configs`);
  if (!res.ok) throw new Error("Failed to fetch meal price configs");
  return res.json() as Promise<MealPriceConfig[]>;
}

export async function createMealPriceConfig(
  payload: MealPriceConfigCreate
): Promise<MealPriceConfig> {
  const res = await fetch(`${BASE}/meal-price-configs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create meal price config");
  return res.json() as Promise<MealPriceConfig>;
}

export async function updateMealPriceConfig(
  id: number,
  payload: Partial<MealPriceConfig>
): Promise<MealPriceConfig> {
  const res = await fetch(`${BASE}/meal-price-configs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to update meal price config"));
  }
  return res.json() as Promise<MealPriceConfig>;
}

export async function deleteMealPriceConfig(id: number): Promise<void> {
  const res = await fetch(`${BASE}/meal-price-configs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal price config");
}

export async function fetchDailyMealForecast(
  date: string
): Promise<DailyMealForecastResponse> {
  const res = await fetch(`${BASE}/meals/forecast?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to fetch daily meal forecast"));
  }
  return res.json() as Promise<DailyMealForecastResponse>;
}

export async function lockMealSession(
  payload: MealSessionLockCreate
): Promise<MealSessionLock> {
  const res = await fetch(`${BASE}/meals/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to lock meal session"));
  }
  return res.json() as Promise<MealSessionLock>;
}

export async function fetchMealExpenseReport(
  startDate: string,
  endDate: string
): Promise<MealExpenseReportResponse> {
  const res = await fetch(
    `${BASE}/reports/meal-expenses?start_date=${encodeURIComponent(
      startDate
    )}&end_date=${encodeURIComponent(endDate)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch meal expense report");
  }
  return res.json() as Promise<MealExpenseReportResponse>;
}

export async function fetchDailyPresenceReport(
  targetDate: string
): Promise<DailyPresenceReportResponse> {
  const res = await fetch(
    `${BASE}/reports/daily-presence?target_date=${encodeURIComponent(targetDate)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch daily presence report");
  }
  return res.json() as Promise<DailyPresenceReportResponse>;
}

export async function validateMealLocks(
  startDate: string,
  endDate: string
): Promise<{ missing_dates: { date: string; missing_sessions: string[] }[] }> {
  const res = await fetch(
    `${BASE}/reports/meal-expenses/validate-locks?start_date=${encodeURIComponent(
      startDate
    )}&end_date=${encodeURIComponent(endDate)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Không thể kiểm tra trạng thái chốt suất ăn");
  }
  return res.json();
}

export async function downloadMealExpenseReport(
  startDate: string,
  endDate: string
): Promise<void> {
  const url = `${BASE}/exports/meal-expense?start_date=${encodeURIComponent(
    startDate
  )}&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Không thể tải Báo cáo Chi phí Bữa ăn");
  }
  const blob = await res.blob();
  const filename = "Bao_Cao_Chi_Phi_Bua_An.xlsx";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function downloadJanitorPayrollReport(
  startDate: string,
  endDate: string
): Promise<void> {
  const url = `${BASE}/reports/janitor-payroll/export?start_date=${encodeURIComponent(
    startDate
  )}&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Không thể tải Báo cáo Chấm công & Lương Tạp vụ");
  }
  const blob = await res.blob();
  const filename = `BCC_LUONG_TAP_VU_${startDate.replace(/-/g, "")}_${endDate.replace(/-/g, "")}.xlsx`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}


