import React, { useState, useEffect } from "react";
import type { EventDay, MealPriceConfig, Stay, ForeignEmployee } from "../types";
import {
  fetchEventDays,
  createEventDay,
  deleteEventDay,
  fetchMealPriceConfigs,
  createMealPriceConfig,
  fetchStays,
  fetchEmployees,
  createMealAbsence,
  fetchMealAbsences,
  deleteMealAbsence,
} from "../api";
import type { MealAbsence } from "../types";

export const MealConfigAndEvents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EVENTS" | "PRICING" | "ABSENCES">("EVENTS");

  // Event Days state
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [evDate, setEvDate] = useState("");
  const [evNotes, setEvNotes] = useState("");

  // Meal Price Configs state
  const [priceConfigs, setPriceConfigs] = useState<MealPriceConfig[]>([]);
  const [dayType, setDayType] = useState<"NORMAL" | "PRESIDENT_VISIT">("NORMAL");
  const [pricePerMeal, setPricePerMeal] = useState<number>(35000);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);

  // Absences state
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [selectedStayId, setSelectedStayId] = useState<number | "">("");
  const [absences, setAbsences] = useState<MealAbsence[]>([]);
  const [absDate, setAbsDate] = useState("");
  const [absReason, setAbsReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [evData, pData, sData, eData] = await Promise.all([
        fetchEventDays(),
        fetchMealPriceConfigs(),
        fetchStays(undefined, "active"),
        fetchEmployees(),
      ]);
      setEventDays(evData);
      setPriceConfigs(pData);
      setStays(sData);
      setEmployees(eData);

      if (sData.length > 0 && !selectedStayId) {
        setSelectedStayId(sData[0].id);
      }
    } catch (err) {
      console.error("Failed to load configs and events:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStayId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAbsencesForStay = async (stayId: number) => {
    try {
      const data = await fetchMealAbsences(stayId);
      setAbsences(data);
    } catch (err) {
      console.error("Failed to fetch absences:", err);
    }
  };

  useEffect(() => {
    if (selectedStayId) {
      loadAbsencesForStay(Number(selectedStayId));
    } else {
      setAbsences([]);
    }
  }, [selectedStayId]);

  // Handle Event Day Create
  const handleCreateEventDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!evDate) return;
    try {
      await createEventDay({
        event_date: evDate,
        event_type: "PRESIDENT_VISIT",
        notes: evNotes || "Chủ tịch sang",
      });
      setEvDate("");
      setEvNotes("");
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    }
  };

  // Handle Event Day Delete
  const handleDeleteEventDay = async (id: number) => {
    if (!window.confirm("Xóa ngày sự kiện này?")) return;
    await deleteEventDay(id);
    loadData();
  };

  // Handle Meal Price Config Create
  const handleCreatePriceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createMealPriceConfig({
        day_type: dayType,
        price_per_meal: Number(pricePerMeal),
        effective_from: effectiveFrom,
      });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    }
  };

  // Handle Meal Absence Create
  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStayId || !absDate) return;
    try {
      await createMealAbsence(Number(selectedStayId), {
        absence_date: absDate,
        reason: absReason || null,
      });
      setAbsDate("");
      setAbsReason("");
      loadAbsencesForStay(Number(selectedStayId));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm ngày vắng ăn.");
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!selectedStayId) return;
    await deleteMealAbsence(id);
    loadAbsencesForStay(Number(selectedStayId));
  };

  const getEmpName = (employeeId: number) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.name_latin} (${emp.passport_number})` : `#${employeeId}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cấu hình Đơn giá & Ngày Sự kiện Suất ăn</h2>
          <p className="text-sm text-slate-500">Quản lý ngày sự kiện đặc biệt, vắng ăn và đơn giá bữa ăn KTX</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("EVENTS")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all ${
              activeTab === "EVENTS" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ngày Sự kiện
          </button>
          <button
            onClick={() => setActiveTab("PRICING")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all ${
              activeTab === "PRICING" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đơn giá Suất ăn
          </button>
          <button
            onClick={() => setActiveTab("ABSENCES")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all ${
              activeTab === "ABSENCES" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đánh dấu Vắng ăn
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải dữ liệu cấu hình...</div>
      ) : (
        <>
          {/* TAB 1: EVENT DAYS */}
      {activeTab === "EVENTS" && (
        <div className="space-y-6">
          <form onSubmit={handleCreateEventDay} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Đánh dấu Ngày Sự kiện mới ("Chủ tịch sang")</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ngày diễn ra</label>
                <input
                  type="date"
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú / Mô tả</label>
                <input
                  type="text"
                  value={evNotes}
                  onChange={(e) => setEvNotes(e.target.value)}
                  placeholder="VD: Chủ tịch sang làm việc"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg cursor-pointer transition-colors"
                >
                  + Thêm Ngày Sự kiện
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Ngày Sự Kiện</th>
                  <th className="px-4 py-3">Loại Sự Kiện</th>
                  <th className="px-4 py-3">Ghi Chú</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventDays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Chưa có ngày sự kiện nào được thiết lập.
                    </td>
                  </tr>
                ) : (
                  eventDays.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">#{ev.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">{ev.event_date}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                          {ev.event_type === "PRESIDENT_VISIT" ? "Chủ tịch sang" : ev.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{ev.notes || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteEventDay(ev.id)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MEAL PRICE CONFIGS */}
      {activeTab === "PRICING" && (
        <div className="space-y-6">
          <form onSubmit={handleCreatePriceConfig} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Cấu hình Mốc Đơn giá Bữa ăn Mới</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Loại Ngày</label>
                <select
                  value={dayType}
                  onChange={(e) => {
                    const dt = e.target.value as "NORMAL" | "PRESIDENT_VISIT";
                    setDayType(dt);
                    setPricePerMeal(dt === "NORMAL" ? 35000 : 50000);
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="NORMAL">Ngày Thường (NORMAL)</option>
                  <option value="PRESIDENT_VISIT">Ngày Chủ tịch sang (PRESIDENT_VISIT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Đơn giá / Bữa (VNĐ)</label>
                <input
                  type="number"
                  step={5000}
                  value={pricePerMeal}
                  onChange={(e) => setPricePerMeal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Áp dụng từ ngày</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg cursor-pointer transition-colors"
                >
                  Lưu Đơn Giá
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Loại Ngày</th>
                  <th className="px-4 py-3">Đơn Giá / Bữa</th>
                  <th className="px-4 py-3">Hiệu Lực Từ Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priceConfigs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">#{cfg.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          cfg.day_type === "PRESIDENT_VISIT"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {cfg.day_type === "PRESIDENT_VISIT" ? "Chủ tịch sang" : "Ngày thường"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {cfg.price_per_meal.toLocaleString("vi-VN")} VNĐ
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{cfg.effective_from}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MEAL ABSENCES */}
      {activeTab === "ABSENCES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chọn Đợt Lưu Trú (Stay Active)</label>
              <select
                value={selectedStayId}
                onChange={(e) => setSelectedStayId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 font-medium"
              >
                {stays.map((s) => (
                  <option key={s.id} value={s.id}>
                    Stay #{s.id} — {getEmpName(s.employee_id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ngày vắng ăn</label>
              <input
                type="date"
                value={absDate}
                onChange={(e) => setAbsDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lý do vắng</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={absReason}
                  onChange={(e) => setAbsReason(e.target.value)}
                  placeholder="VD: Về nước tạm thời / Công tác ngoài"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <button
                  onClick={handleCreateAbsence}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Thêm Vắng
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Mã Stay</th>
                  <th className="px-4 py-3">Ngày Vắng Ăn</th>
                  <th className="px-4 py-3">Lý Do</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absences.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Chưa có ngày vắng ăn nào cho đợt lưu trú này.
                    </td>
                  </tr>
                ) : (
                  absences.map((abs) => (
                    <tr key={abs.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-500">#{abs.id}</td>
                      <td className="px-4 py-3 font-mono">#{abs.stay_id}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-rose-700">{abs.absence_date}</td>
                      <td className="px-4 py-3">{abs.reason || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAbsence(abs.id)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
