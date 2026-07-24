import React, { useEffect, useState } from "react";
import {
  createMealAbsence,
  deleteMealAbsence,
  fetchDailyMealForecast,
  fetchMealAbsences,
  lockMealSession,
} from "../api";
import type {
  DailyMealEmployeeItem,
  DailyMealForecastResponse,
  DailyMealSessionSummary,
  MealAbsence,
} from "../types";
import { LockMealSessionModal } from "./LockMealSessionModal";
import { MealSessionCards } from "./meal-forecast/MealSessionCards";
import { MealEmployeeForecastTable } from "./meal-forecast/MealEmployeeForecastTable";

export const MealForecastBoard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [forecast, setForecast] = useState<DailyMealForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lodgingFilter, setLodgingFilter] = useState<"ALL" | "KTX" | "HOTEL">("ALL");

  const [lockSessionTarget, setLockSessionTarget] =
    useState<DailyMealSessionSummary | null>(null);

  const loadForecast = async (date: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchDailyMealForecast(date);
      setForecast(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tải dữ liệu dự báo suất ăn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(selectedDate);
  }, [selectedDate]);

  const handleToggleAbsence = async (
    emp: DailyMealEmployeeItem,
    sessionType: "BREAKFAST" | "DINNER"
  ) => {
    const isCurrentAbsent =
      sessionType === "BREAKFAST" ? emp.is_breakfast_absent : emp.is_dinner_absent;

    try {
      if (isCurrentAbsent) {
        const absences: MealAbsence[] = await fetchMealAbsences(emp.stay_id);
        const targetAbs = absences.find(
          (a) =>
            a.absence_date === selectedDate &&
            (a.meal_type === sessionType || a.meal_type === "ALL_DAY" || !a.meal_type)
        );
        if (targetAbs) {
          await deleteMealAbsence(targetAbs.id);
        }
      } else {
        await createMealAbsence(emp.stay_id, {
          absence_date: selectedDate,
          meal_type: sessionType,
          reason: "Bật/tắt vắng ăn từ bảng Thống kê hằng ngày",
        });
      }
      await loadForecast(selectedDate);
    } catch (err: any) {
      alert(`Không thể thay đổi trạng thái vắng ăn: ${err.message}`);
    }
  };

  const handleLockSessionConfirm = async (payload: {
    lock_date: string;
    meal_session: "BREAKFAST" | "DINNER";
    calculated_meal_count: number;
    final_meal_count: number;
    locked_price_per_meal: number;
    notes?: string;
  }) => {
    await lockMealSession(payload);
    await loadForecast(selectedDate);
  };

  const filteredEmployees =
    forecast?.employees.filter((emp) => {
      if (lodgingFilter !== "ALL" && emp.accommodation_type !== lodgingFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        emp.name_latin.toLowerCase().includes(term) ||
        (emp.name_chinese && emp.name_chinese.toLowerCase().includes(term)) ||
        (emp.employee_code && emp.employee_code.toLowerCase().includes(term)) ||
        emp.location_name.toLowerCase().includes(term)
      );
    }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header controls & Date Selector */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              📅 Chọn ngày xem & chốt:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all cursor-pointer"
            />
          </div>

          {forecast && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 ${
                  forecast.day_type === "NORMAL"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-purple-100 text-purple-800 border-purple-300"
                }`}
              >
                <span>{forecast.day_type === "NORMAL" ? "🏷️" : "⭐"}</span>
                <span>Loại ngày: <strong>{forecast.day_type_name || forecast.day_type}</strong></span>
                <span className="opacity-40">|</span>
                <span className="font-mono">
                  {(forecast.suggested_price_per_meal ?? 30000).toLocaleString("vi-VN")} VNĐ/bữa
                </span>
              </span>

              {forecast.event_notes && (
                <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium border border-slate-200">
                  💡 {forecast.event_notes}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadForecast(selectedDate)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Đang tải dự báo suất ăn...</div>
      ) : forecast ? (
        <>
          <MealSessionCards forecast={forecast} onLockSession={setLockSessionTarget} />
          <MealEmployeeForecastTable
            filteredEmployees={filteredEmployees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            lodgingFilter={lodgingFilter}
            setLodgingFilter={setLodgingFilter}
            onToggleAbsence={handleToggleAbsence}
          />
        </>
      ) : null}

      {lockSessionTarget && (
        <LockMealSessionModal
          isOpen={!!lockSessionTarget}
          onClose={() => setLockSessionTarget(null)}
          sessionSummary={lockSessionTarget}
          targetDate={selectedDate}
          suggestedPrice={forecast?.suggested_price_per_meal ?? 30000}
          onConfirm={handleLockSessionConfirm}
        />
      )}
    </div>
  );
};
