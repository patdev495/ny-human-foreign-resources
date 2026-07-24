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

export const MealForecastBoard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [forecast, setForecast] = useState<DailyMealForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lodgingFilter, setLodgingFilter] = useState<"ALL" | "KTX" | "HOTEL">("ALL");

  // Lock modal state
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

  // Handle toggling absence per employee and session
  const handleToggleAbsence = async (
    emp: DailyMealEmployeeItem,
    sessionType: "BREAKFAST" | "DINNER"
  ) => {
    const isCurrentAbsent =
      sessionType === "BREAKFAST" ? emp.is_breakfast_absent : emp.is_dinner_absent;

    try {
      if (isCurrentAbsent) {
        // Find existing absence to delete
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
        // Create absence for sessionType
        await createMealAbsence(emp.stay_id, {
          absence_date: selectedDate,
          meal_type: sessionType,
          reason: "Bật/tắt vắng ăn từ bảng Thống kê hằng ngày",
        });
      }
      // Reload forecast
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

  // Filtered employees list
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
    <div className="space-y-6">
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

      {/* Summary Cards: Breakfast & Dinner */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Breakfast Card */}
          <div
            className={`rounded-2xl border p-5 transition-all shadow-xs ${
              forecast.breakfast.is_locked
                ? "bg-emerald-50/50 border-emerald-300"
                : "bg-amber-50/40 border-amber-300/80"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-700 rounded-xl text-xl">🍳</span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Bữa Sáng</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {forecast.breakfast.is_locked ? (
                      <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">⏳ Chưa chốt</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Lock Button */}
              {!forecast.breakfast.is_locked ? (
                <button
                  onClick={() => setLockSessionTarget(forecast.breakfast)}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🔒 Chốt Bữa Sáng
                </button>
              ) : (
                <button
                  onClick={() => setLockSessionTarget(forecast.breakfast)}
                  title="Bấm để điều chỉnh / chốt lại suất ăn"
                  className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>✓ Đã Khóa</span>
                  <span className="text-[11px] font-semibold text-emerald-700 underline ml-1">✏️ Cập nhật</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Suất gợi ý tự động:</span>
                <span className="text-lg font-black text-slate-800">
                  {forecast.breakfast.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
                <span className={`text-lg font-black ${forecast.breakfast.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
                  {forecast.breakfast.is_locked
                    ? `${forecast.breakfast.final_meal_count} suất`
                    : "--"}
                </span>
              </div>
            </div>

            {forecast.breakfast.is_locked && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Đơn giá chốt:</span>
                  <strong className="text-slate-800">
                    {forecast.breakfast.locked_price_per_meal?.toLocaleString()} VNĐ
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thành tiền chốt:</span>
                  <strong className="text-emerald-800 font-bold">
                    {(
                      (forecast.breakfast.final_meal_count ?? 0) *
                      (forecast.breakfast.locked_price_per_meal ?? 0)
                    ).toLocaleString()}{" "}
                    VNĐ
                  </strong>
                </div>
                {forecast.breakfast.notes && (
                  <p className="text-amber-800 bg-amber-100/60 p-2 rounded-lg text-[11px] italic mt-1">
                    📝 Ghi chú: {forecast.breakfast.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dinner Card */}
          <div
            className={`rounded-2xl border p-5 transition-all shadow-xs ${
              forecast.dinner.is_locked
                ? "bg-emerald-50/50 border-emerald-300"
                : "bg-indigo-50/40 border-indigo-300/80"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-xl">🌙</span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Bữa Tối</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {forecast.dinner.is_locked ? (
                      <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                    ) : (
                      <span className="text-indigo-700 font-semibold">⏳ Chưa chốt</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Lock Button */}
              {!forecast.dinner.is_locked ? (
                <button
                  onClick={() => setLockSessionTarget(forecast.dinner)}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🔒 Chốt Bữa Tối
                </button>
              ) : (
                <button
                  onClick={() => setLockSessionTarget(forecast.dinner)}
                  title="Bấm để điều chỉnh / chốt lại suất ăn"
                  className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>✓ Đã Khóa</span>
                  <span className="text-[11px] font-semibold text-emerald-700 underline ml-1">✏️ Cập nhật</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Suất gợi ý tự động:</span>
                <span className="text-lg font-black text-slate-800">
                  {forecast.dinner.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
                <span className={`text-lg font-black ${forecast.dinner.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
                  {forecast.dinner.is_locked
                    ? `${forecast.dinner.final_meal_count} suất`
                    : "--"}
                </span>
              </div>
            </div>

            {forecast.dinner.is_locked && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Đơn giá chốt:</span>
                  <strong className="text-slate-800">
                    {forecast.dinner.locked_price_per_meal?.toLocaleString()} VNĐ
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thành tiền chốt:</span>
                  <strong className="text-emerald-800 font-bold">
                    {(
                      (forecast.dinner.final_meal_count ?? 0) *
                      (forecast.dinner.locked_price_per_meal ?? 0)
                    ).toLocaleString()}{" "}
                    VNĐ
                  </strong>
                </div>
                {forecast.dinner.notes && (
                  <p className="text-indigo-900 bg-indigo-100/60 p-2 rounded-lg text-[11px] italic mt-1">
                    📝 Ghi chú: {forecast.dinner.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employees Meal Status Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-800 text-sm">
              📋 Danh sách Nhân sự & Trạng thái Ăn uống Ngày {selectedDate}
            </h3>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filteredEmployees.length} người
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Tìm tên, phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-blue-500 outline-none w-full md:w-48"
            />

            {/* Lodging Filter */}
            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setLodgingFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lodgingFilter === "ALL" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setLodgingFilter("KTX")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lodgingFilter === "KTX" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                KTX
              </button>
              <button
                onClick={() => setLodgingFilter("HOTEL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lodgingFilter === "HOTEL" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                Khách sạn
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải dữ liệu...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Không tìm thấy nhân sự lưu trú phù hợp cho ngày này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Loại chỗ ở</th>
                  <th className="py-3 px-4">Vị trí ở</th>
                  <th className="py-3 px-4 text-center">Bữa Sáng 🍳</th>
                  <th className="py-3 px-4 text-center">Bữa Tối 🌙</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const isKtx = emp.accommodation_type === "KTX";
                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{emp.name_latin}</div>
                        {emp.name_chinese && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {emp.name_chinese}
                          </div>
                        )}
                      </td>

                      {/* Accommodation Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${
                            isKtx
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {isKtx ? "🏢 KTX" : "🏨 Khách sạn"}
                        </span>
                      </td>

                      {/* Location Name */}
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {emp.location_name}
                      </td>

                      {/* Breakfast status toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAbsence(emp, "BREAKFAST")}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
                            emp.is_breakfast_absent
                              ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                              : isKtx
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {emp.is_breakfast_absent
                            ? "❌ Vắng sáng"
                            : isKtx
                            ? "✓ Ăn sáng"
                            : "Không ăn"}
                        </button>
                      </td>

                      {/* Dinner status toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAbsence(emp, "DINNER")}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
                            emp.is_dinner_absent
                              ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                              : isKtx
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {emp.is_dinner_absent
                            ? "❌ Vắng tối"
                            : isKtx
                            ? "✓ Ăn tối"
                            : "Không ăn"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lock Session Modal */}
      {lockSessionTarget && forecast && (
        <LockMealSessionModal
          date={forecast.date}
          sessionSummary={lockSessionTarget}
          dayTypeName={forecast.day_type_name}
          suggestedPrice={forecast.suggested_price_per_meal}
          onClose={() => setLockSessionTarget(null)}
          onConfirm={handleLockSessionConfirm}
        />
      )}
    </div>
  );
};
