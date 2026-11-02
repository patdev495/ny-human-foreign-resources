import { useEffect, useState } from "react";
import { fetchDailyMealForecast } from "../../api";
import type { DailyMealForecastResponse } from "../../types";
import { MealReportingStatus } from "./MealReportingStatus";
import { vietnamDate } from "./vietnamDate";

export function MealReportingOverview() {
  const [date, setDate] = useState(() => vietnamDate(1));
  const [refresh, setRefresh] = useState(0);
  const [forecast, setForecast] = useState<DailyMealForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setForecast(null);
    fetchDailyMealForecast(date)
      .then(result => { if (live) setForecast(result); })
      .catch(() => { if (live) setError("Không thể tải tình trạng báo cơm."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [date, refresh]);

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-bold text-slate-900">Tình trạng báo cơm</h2>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-700">Ngày ăn
          <input type="date" value={date} onChange={event => setDate(event.target.value)}
            className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2" />
        </label>
        <button type="button" onClick={() => setRefresh(current => current + 1)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Làm mới</button>
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading ? <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">Đang tải báo cơm…</p> :
      forecast?.uses_meal_reports ? <MealReportingStatus key={date} date={date} employees={forecast.employees} /> :
        !error && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Ngày này không áp dụng báo cơm.</p>}
  </div>;
}
