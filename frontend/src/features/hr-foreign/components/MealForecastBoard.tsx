import { useEffect, useState } from "react";
import { fetchDailyMealForecast, lockMealSession } from "../api";
import type { DailyMealForecastResponse, DailyMealSessionSummary } from "../types";
import { LockMealSessionModal } from "./LockMealSessionModal";
import { MealSessionCards } from "./meal-forecast/MealSessionCards";
import { MealEmployeeForecastTable } from "./meal-forecast/MealEmployeeForecastTable";

export function MealForecastBoard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [forecast, setForecast] = useState<DailyMealForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lodging, setLodging] = useState<"ALL" | "KTX" | "HOTEL">("ALL");
  const [lockTarget, setLockTarget] = useState<DailyMealSessionSummary | null>(null);

  async function load(date: string, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      setForecast(await fetchDailyMealForecast(date));
    } catch {
      setError("Không thể tải dự báo suất ăn. Kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(selectedDate); }, [selectedDate]);

  async function confirmLock(payload: {
    lock_date: string;
    meal_session: "BREAKFAST" | "LUNCH" | "DINNER";
    calculated_meal_count: number;
    final_meal_count: number;
    locked_price_per_meal: number;
    notes?: string;
  }) {
    await lockMealSession(payload);
    await load(selectedDate, false);
  }

  const employees = forecast?.employees.filter(employee => {
    if (lodging !== "ALL" && employee.accommodation_type !== lodging) return false;
    const term = search.toLocaleLowerCase();
    return !term || employee.name_latin.toLocaleLowerCase().includes(term)
      || (employee.name_chinese ?? "").toLocaleLowerCase().includes(term)
      || (employee.employee_code ?? "").toLocaleLowerCase().includes(term)
      || employee.location_name.toLocaleLowerCase().includes(term);
  }) ?? [];

  const suggestedPrice = lockTarget?.meal_session === "BREAKFAST"
    ? forecast?.suggested_breakfast_price
    : lockTarget?.meal_session === "LUNCH"
      ? forecast?.suggested_janitor_price
      : forecast?.suggested_dinner_price;

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
        📅 Chọn ngày xem & chốt:
        <input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800" />
      </label>
      <button type="button" onClick={() => void load(selectedDate)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">🔄 Làm mới</button>
    </div>

    {forecast && <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
      <span className="rounded-xl bg-blue-50 px-3 py-2">Loại ngày: {forecast.day_type_name ?? forecast.day_type}</span>
      <span className="rounded-xl bg-blue-50 px-3 py-2">Sáng: {(forecast.suggested_breakfast_price ?? 30000).toLocaleString("vi-VN")}đ</span>
      <span className="rounded-xl bg-blue-50 px-3 py-2">Tối: {(forecast.suggested_dinner_price ?? 40000).toLocaleString("vi-VN")}đ</span>
      <span className="rounded-xl bg-blue-50 px-3 py-2">Lao công: {(forecast.suggested_janitor_price ?? 25000).toLocaleString("vi-VN")}đ</span>
      {forecast.event_notes && <span className="rounded-xl bg-slate-100 px-3 py-2">{forecast.event_notes}</span>}
    </div>}

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    {loading ? <p className="p-12 text-center text-slate-500">Đang tải dự báo suất ăn...</p> : forecast && <>
      <MealSessionCards forecast={forecast} onLockSession={setLockTarget} />
      <MealEmployeeForecastTable key={selectedDate} filteredEmployees={employees} searchTerm={search} setSearchTerm={setSearch}
        lodgingFilter={lodging} setLodgingFilter={setLodging} date={selectedDate} usesMealReports={forecast.uses_meal_reports} />
    </>}

    {lockTarget && <LockMealSessionModal date={selectedDate} sessionSummary={lockTarget}
      employees={forecast?.employees ?? []} usesMealReports={forecast?.uses_meal_reports ?? false}
      dayTypeName={forecast?.day_type_name} suggestedPrice={suggestedPrice}
      onClose={() => setLockTarget(null)} onConfirm={confirmLock} />}
  </div>;
}
