import { useEffect, useState, useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { fetchDailyMealForecast, fetchMealCutoff, lockMealSession } from "../api";
import type { DailyMealForecastResponse, DailyMealSessionSummary, MealSessionLockCreate } from "../types";
import { LockMealSessionModal } from "./LockMealSessionModal";
import { MealSessionCards } from "./meal-forecast/MealSessionCards";
import { MealReportingStatus } from "./meal-forecast/MealReportingStatus";
import { MealEmployeeForecastTable } from "./meal-forecast/MealEmployeeForecastTable";
import { vietnamDate } from "./meal-forecast/vietnamDate";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";

export function MealForecastBoard() {
  const [selectedDate, setSelectedDate] = useState(() => vietnamDate(1));
  const [forecast, setForecast] = useState<DailyMealForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lodging, setLodging] = useState<"ALL" | "KTX" | "HOTEL">("ALL");
  const [lockTarget, setLockTarget] = useState<DailyMealSessionSummary | null>(null);
  const [cutoff, setCutoff] = useState<string | null>(null);
  const [cutoffError, setCutoffError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const loadCutoff = useCallback(async (): Promise<void> => {
    setCutoffError(null);
    try { setCutoff(await fetchMealCutoff()); }
    catch { setCutoffError("Không thể tải mốc chốt Báo cơm. Vui lòng thử lại trước khi chốt Sáng/Tối."); }
  }, []);
  useEffect(() => { void loadCutoff(); }, [loadCutoff]);

  const load = useCallback(async (date: string, showLoading = true): Promise<void> => {
    const sequence = ++requestSequence.current;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await fetchDailyMealForecast(date);
      if (sequence === requestSequence.current) setForecast(result);
    } catch {
      if (sequence === requestSequence.current) setError("Không thể tải dự báo suất ăn. Kiểm tra kết nối rồi thử lại.");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(selectedDate);
    return () => { requestSequence.current += 1; };
  }, [selectedDate, load]);

  async function confirmLock(payload: MealSessionLockCreate): Promise<void> {
    await lockMealSession(payload);
    await load(selectedDate, false);
  }
  const currentForecast = !loading && !error && forecast?.date === selectedDate ? forecast : null;
  const employees = currentForecast?.employees.filter((employee) => {
    if (lodging !== "ALL" && employee.accommodation_type !== lodging) return false;
    const term = search.trim().toLocaleLowerCase();
    return !term || [employee.name_latin, employee.name_chinese, employee.employee_code, employee.location_name].some((value) => value?.toLocaleLowerCase().includes(term));
  }) ?? [];
  const suggestedPrice = lockTarget?.meal_session === "BREAKFAST" ? currentForecast?.suggested_breakfast_price
    : lockTarget?.meal_session === "LUNCH" ? currentForecast?.suggested_janitor_price : currentForecast?.suggested_dinner_price;

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><label htmlFor="meal-date" className="mb-1.5 block text-sm text-slate-600">Ngày xem và chốt suất ăn</label>
        <input id="meal-date" type="date" required value={selectedDate} onChange={(event) => { if (event.target.value) setSelectedDate(event.target.value); }} className={`${systemField} w-auto`} /></div>
      <button type="button" onClick={() => void load(selectedDate)} disabled={loading} className={systemSecondaryButton}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới</button>
    </div>
    {cutoffError && <div role="alert" className="rounded-sm border border-amber-200 bg-white p-3 text-sm text-amber-900">{cutoffError}<button type="button" onClick={() => void loadCutoff()} className={`${systemSecondaryButton} ml-2`}>Thử lại mốc chốt</button></div>}
    {error ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm"><p className="text-red-800">{error}</p><button type="button" onClick={() => void load(selectedDate)} className={`${systemSecondaryButton} mt-2`}>Thử lại</button></div>
      : !currentForecast ? <p role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải dự báo suất ăn…</p> : <>
        <MealSessionCards forecast={currentForecast} onLockSession={setLockTarget} foreignLockDisabled={currentForecast.uses_meal_reports && cutoff === null} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>Loại ngày: {currentForecast.day_type_name ?? currentForecast.day_type}</span>
          <span>Sáng: {currentForecast.suggested_breakfast_price?.toLocaleString("vi-VN") ?? "—"} đ</span>
          <span>Tối: {currentForecast.suggested_dinner_price?.toLocaleString("vi-VN") ?? "—"} đ</span>
          <span>Trưa tạp vụ: {currentForecast.suggested_janitor_price?.toLocaleString("vi-VN") ?? "—"} đ</span>
          {currentForecast.event_notes && <span>{currentForecast.event_notes}</span>}
        </div>
        {currentForecast.uses_meal_reports && <MealReportingStatus key={selectedDate} date={selectedDate} employees={currentForecast.employees} />}
        <MealEmployeeForecastTable key={selectedDate} filteredEmployees={employees} searchTerm={search} setSearchTerm={setSearch}
          lodgingFilter={lodging} setLodgingFilter={setLodging} date={selectedDate} usesMealReports={currentForecast.uses_meal_reports} />
      </>}
    {lockTarget && currentForecast && <LockMealSessionModal date={selectedDate} sessionSummary={lockTarget} cutoff={cutoff ?? ""}
      employees={currentForecast.employees} usesMealReports={currentForecast.uses_meal_reports} dayTypeName={currentForecast.day_type_name} suggestedPrice={suggestedPrice}
      onClose={() => setLockTarget(null)} onConfirm={confirmLock} />}
  </div>;
}
