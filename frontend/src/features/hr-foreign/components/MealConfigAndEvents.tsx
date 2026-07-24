import React, { useState, useEffect, useCallback } from "react";
import type {
  EventDay,
  MealPriceConfig,
  Stay,
  ForeignEmployee,
  MealAbsence,
} from "../types";
import {
  fetchEventDays,
  createEventDaysBatch,
  updateEventDay,
  deleteEventDay,
  fetchMealPriceConfigs,
  createMealPriceConfig,
  updateMealPriceConfig,
  deleteMealPriceConfig,
  fetchStays,
  fetchEmployees,
  createMealAbsence,
  fetchMealAbsences,
  deleteMealAbsence,
} from "../api";

export const MealConfigAndEvents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EVENTS" | "PRICING" | "ABSENCES">(
    "EVENTS"
  );

  // Data states
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<MealPriceConfig[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);

  // Event Settings state
  const [evStartDate, setEvStartDate] = useState<string>("");
  const [evEndDate, setEvEndDate] = useState<string>("");
  const [evSelectedDayType, setEvSelectedDayType] = useState<string>("PRESIDENT_VISIT");
  const [evNotes, setEvNotes] = useState<string>("");

  // Day Type & Price Config state
  const [dtCode, setDtCode] = useState<string>("TET");
  const [dtName, setDtName] = useState<string>("Tết Nguyên Đán");
  const [dtPrice, setDtPrice] = useState<number>(60000);
  const [dtNotes, setDtNotes] = useState<string>("");

  // Edit mode states
  const [editingPriceConfigId, setEditingPriceConfigId] = useState<number | null>(null);
  const [editingEvId, setEditingEvId] = useState<number | null>(null);
  const [editingEvDate, setEditingEvDate] = useState<string>("");
  const [editingEvType, setEditingEvType] = useState<string>("PRESIDENT_VISIT");
  const [editingEvNotes, setEditingEvNotes] = useState<string>("");

  // Absences state
  const [selectedStayId, setSelectedStayId] = useState<number | "">("");
  const [absences, setAbsences] = useState<MealAbsence[]>([]);
  const [absDate, setAbsDate] = useState("");
  const [absReason, setAbsReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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

      if (pData.length > 0 && !pData.some((p) => p.day_type === evSelectedDayType)) {
        // Default to non-NORMAL type if available
        const customType = pData.find((p) => p.day_type !== "NORMAL");
        if (customType) setEvSelectedDayType(customType.day_type);
      }

      if (sData.length > 0 && !selectedStayId) {
        setSelectedStayId(sData[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load configs and events:", err);
      setError(err.message || "Không thể tải dữ liệu cấu hình");
    } finally {
      setLoading(false);
    }
  }, [selectedStayId, evSelectedDayType]);

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

  // Handle Event Days Batch Creation
  const handleCreateEventDaysBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!evStartDate && !evEndDate) {
      setError("Vui lòng nhập 'Từ ngày' hoặc 'Đến ngày'");
      return;
    }

    try {
      const result = await createEventDaysBatch({
        start_date: evStartDate || undefined,
        end_date: evEndDate || undefined,
        event_type: evSelectedDayType,
        notes: evNotes.trim() || undefined,
      });

      const count = result.length;
      const isSingle = count === 1;
      setSuccessMsg(
        isSingle
          ? `✓ Đã đánh dấu ngày sự kiện đơn lẻ (${result[0].event_date}) thành công!`
          : `✓ Đã cài đặt sự kiện cho khoảng ${count} ngày (${result[0].event_date} ➔ ${
              result[count - 1].event_date
            })!`
      );

      setEvStartDate("");
      setEvEndDate("");
      setEvNotes("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Không thể cài đặt sự kiện");
    }
  };

  // Event Day Edit & Delete Handlers
  const handleStartEditEventDay = (ev: EventDay) => {
    setEditingEvId(ev.id);
    setEditingEvDate(ev.event_date);
    setEditingEvType(ev.event_type);
    setEditingEvNotes(ev.notes || "");
  };

  const handleCancelEditEventDay = () => {
    setEditingEvId(null);
  };

  const handleSaveEditEventDay = async (id: number) => {
    try {
      await updateEventDay(id, {
        event_date: editingEvDate,
        event_type: editingEvType,
        notes: editingEvNotes.trim() ? editingEvNotes.trim() : null,
      });
      setSuccessMsg("✓ Đã cập nhật ngày sự kiện thành công!");
      setEditingEvId(null);
      loadData();
    } catch (err: any) {
      alert(`Lỗi khi cập nhật ngày sự kiện: ${err.message}`);
    }
  };

  const handleDeleteEventDay = async (id: number) => {
    if (!window.confirm("Xóa ngày sự kiện này?")) return;
    try {
      await deleteEventDay(id);
      setSuccessMsg("✓ Đã xóa ngày sự kiện!");
      loadData();
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
  };

  // Handle Meal Price Config Create or Update
  const handleSavePriceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!dtCode.trim()) {
      setError("Vui lòng nhập Mã loại ngày");
      return;
    }
    if (dtPrice <= 0) {
      setError("Đơn giá bữa ăn phải lớn hơn 0");
      return;
    }

    try {
      if (editingPriceConfigId !== null) {
        await updateMealPriceConfig(editingPriceConfigId, {
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          price_per_meal: Number(dtPrice),
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(`✓ Đã cập nhật loại ngày '${dtName || dtCode}' thành công!`);
        setEditingPriceConfigId(null);
      } else {
        await createMealPriceConfig({
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          price_per_meal: Number(dtPrice),
          effective_from: new Date().toISOString().split("T")[0],
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(`✓ Đã thêm loại ngày mới '${dtName || dtCode}' với đơn giá ${dtPrice.toLocaleString()} VNĐ!`);
      }

      setDtCode("");
      setDtName("");
      setDtPrice(30000);
      setDtNotes("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Không thể lưu cấu hình đơn giá");
    }
  };

  const handleStartEditPriceConfig = (cfg: MealPriceConfig) => {
    setEditingPriceConfigId(cfg.id);
    setDtCode(cfg.day_type);
    setDtName(cfg.day_type_name || cfg.day_type);
    setDtPrice(cfg.price_per_meal);
    setDtNotes(cfg.notes || "");
    setActiveTab("PRICING");
  };

  const handleCancelEditPriceConfig = () => {
    setEditingPriceConfigId(null);
    setDtCode("");
    setDtName("");
    setDtPrice(30000);
    setDtNotes("");
  };

  const handleDeletePriceConfig = async (cfg: MealPriceConfig) => {
    if (!window.confirm(`Xóa cấu hình loại ngày '${cfg.day_type_name || cfg.day_type}'?`)) return;
    try {
      await deleteMealPriceConfig(cfg.id);
      setSuccessMsg(`✓ Đã xóa loại ngày '${cfg.day_type_name || cfg.day_type}'!`);
      if (editingPriceConfigId === cfg.id) {
        handleCancelEditPriceConfig();
      }
      loadData();
    } catch (err: any) {
      alert(`Lỗi khi xóa cấu hình đơn giá: ${err.message}`);
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
    } catch (err: any) {
      alert(`Lỗi khi thêm ngày vắng ăn: ${err.message}`);
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

  const getDayTypeInfo = (typeCode: string) => {
    const found = priceConfigs.find((p) => p.day_type === typeCode);
    if (found) {
      return {
        name: found.day_type_name || found.day_type,
        price: found.price_per_meal,
      };
    }
    return { name: typeCode, price: 30000 };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
      {/* Top Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            ⚙️ Cấu hình Đơn giá & Cài đặt Sự kiện Suất ăn
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các Loại ngày & Đơn giá suất ăn, gán Ngày sự kiện (đơn lẻ hoặc khoảng ngày) và Đánh dấu vắng ăn.
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab("EVENTS");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === "EVENTS"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🗓️ Cài đặt Sự kiện
          </button>
          <button
            onClick={() => {
              setActiveTab("PRICING");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === "PRICING"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💰 Danh mục Loại ngày & Đơn giá
          </button>
          <button
            onClick={() => {
              setActiveTab("ABSENCES");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === "ABSENCES"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ❌ Vắng ăn KTX
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Đang tải dữ liệu cấu hình...</div>
      ) : (
        <>
          {/* TAB 1: EVENT SETTINGS (CÀI ĐẶT SỰ KIỆN KHỎANG NGÀY / NGÀY ĐƠN LẺ) */}
          {activeTab === "EVENTS" && (
            <div className="space-y-6">
              {/* Form Cài đặt Sự kiện */}
              <form
                onSubmit={handleCreateEventDaysBatch}
                className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span>🗓️ Cài đặt Sự kiện & Đánh dấu Loại ngày</span>
                  </h3>
                  <span className="text-[11px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    Hỗ trợ khoảng ngày hoặc ngày đơn lẻ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={evStartDate}
                      onChange={(e) => setEvStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={evEndDate}
                      onChange={(e) => setEvEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Day Type Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Loại ngày áp dụng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={evSelectedDayType}
                      onChange={(e) => setEvSelectedDayType(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:border-blue-500 outline-none"
                    >
                      {priceConfigs.filter((cfg) => cfg.day_type !== "NORMAL").map((cfg) => (
                        <option key={cfg.id} value={cfg.day_type}>
                          {cfg.day_type_name || cfg.day_type} ({cfg.price_per_meal.toLocaleString()} VNĐ)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>+ Gán Sự kiện</span>
                    </button>
                  </div>
                </div>

                {/* Notes Input & Helper notice */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={evNotes}
                      onChange={(e) => setEvNotes(e.target.value)}
                      placeholder="Mô tả / Ghi chú lý do (VD: Lịch đón Chủ tịch tập đoàn sang thăm nhà máy...)"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 bg-white/80 border border-slate-200 rounded-xl p-2 flex items-center">
                    💡 <i>Nếu chỉ điền 1 trong 2 ô ngày, hệ thống sẽ đánh dấu ngày đơn lẻ đó.</i>
                  </div>
                </div>
              </form>

              {/* Event Days Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Ngày Sự Kiện</th>
                      <th className="px-4 py-3">Loại Ngày</th>
                      <th className="px-4 py-3">Đơn Giá Áp Dụng</th>
                      <th className="px-4 py-3">Ghi Chú</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventDays.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          Chưa có ngày sự kiện đặc biệt nào được cài đặt.
                        </td>
                      </tr>
                    ) : (
                      eventDays.map((ev) => {
                        const isEditing = editingEvId === ev.id;
                        const typeInfo = getDayTypeInfo(ev.event_type);
                        const isNormal = ev.event_type === "NORMAL";

                        if (isEditing) {
                          return (
                            <tr key={ev.id} className="bg-blue-50/60 transition-colors">
                              <td className="px-4 py-3 font-mono text-slate-500 font-bold">#{ev.id}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={editingEvDate}
                                  onChange={(e) => setEditingEvDate(e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={editingEvType}
                                  onChange={(e) => setEditingEvType(e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 outline-none"
                                >
                                  {priceConfigs.filter((cfg) => cfg.day_type !== "NORMAL").map((cfg) => (
                                    <option key={cfg.id} value={cfg.day_type}>
                                      {cfg.day_type_name || cfg.day_type}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-600">
                                {getDayTypeInfo(editingEvType).price.toLocaleString("vi-VN")} VNĐ
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingEvNotes}
                                  onChange={(e) => setEditingEvNotes(e.target.value)}
                                  placeholder="Ghi chú..."
                                  className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none"
                                />
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditEventDay(ev.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold cursor-pointer transition-all shadow-xs"
                                >
                                  💾 Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditEventDay}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  ✕ Hủy
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-400">#{ev.id}</td>
                            <td className="px-4 py-3 font-extrabold text-slate-900 font-mono">
                              {ev.event_date}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                                  isNormal
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : "bg-purple-100 text-purple-800 border border-purple-200"
                                }`}
                              >
                                {typeInfo.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-extrabold text-slate-800 font-mono">
                              {typeInfo.price.toLocaleString("vi-VN")} VNĐ
                            </td>
                            <td className="px-4 py-3 text-slate-600">{ev.notes || "-"}</td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditEventDay(ev)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEventDay(ev.id)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                              >
                                ❌ Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MEAL PRICE CONFIGS (DANH MỤC LOẠI NGÀY & ĐƠN GIÁ) */}
          {activeTab === "PRICING" && (
            <div className="space-y-6">
              {/* Form Thêm/Cập nhật Loại ngày */}
              <form
                onSubmit={handleSavePriceConfig}
                className="p-5 bg-gradient-to-r from-amber-50/50 to-orange-50/40 border border-amber-200/80 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span>
                      {editingPriceConfigId !== null
                        ? `✏️ Cập nhật Loại ngày Suất ăn (#${editingPriceConfigId})`
                        : "💰 Thêm mới & Cấu hình Loại ngày Suất ăn"}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {editingPriceConfigId !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditPriceConfig}
                        className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition-all"
                      >
                        ✕ Hủy sửa
                      </button>
                    )}
                    <span className="text-[11px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                      Loại ngày bình thường mặc định là 30.000 VNĐ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Loại ngày (Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dtCode}
                      onChange={(e) => setDtCode(e.target.value.toUpperCase())}
                      placeholder="VD: NORMAL, PRESIDENT_VISIT, TET"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 uppercase focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên hiển thị Loại ngày <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dtName}
                      onChange={(e) => setDtName(e.target.value)}
                      placeholder="VD: Ngày bình thường, Chủ tịch sang..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đơn giá / Bữa (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={dtPrice}
                      onChange={(e) => setDtPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-extrabold bg-white text-slate-800 font-mono focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className={`w-full px-4 py-2 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                        editingPriceConfigId !== null
                          ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                          : "bg-amber-600 hover:bg-amber-700 active:scale-95"
                      }`}
                    >
                      {editingPriceConfigId !== null ? "💾 Cập Nhật Đơn Giá" : "💾 Thêm Loại Giá"}
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={dtNotes}
                    onChange={(e) => setDtNotes(e.target.value)}
                    placeholder="Ghi chú mô tả thêm về loại ngày này (tùy chọn)"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>
              </form>

              {/* Day Types & Prices Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Mã Loại Ngày</th>
                      <th className="px-4 py-3">Tên Hiển Thị</th>
                      <th className="px-4 py-3">Đơn Giá / Bữa (VNĐ)</th>
                      <th className="px-4 py-3">Ghi Chú</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceConfigs.map((cfg) => {
                      const isNormal = cfg.day_type === "NORMAL";
                      const isBeingEdited = editingPriceConfigId === cfg.id;
                      return (
                        <tr
                          key={cfg.id}
                          className={`transition-colors ${
                            isBeingEdited ? "bg-amber-50/80" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {cfg.day_type}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                                isNormal
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : "bg-purple-50 text-purple-800 border-purple-200"
                              }`}
                            >
                              {cfg.day_type_name || (isNormal ? "Ngày bình thường" : cfg.day_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-amber-700 text-sm">
                            {cfg.price_per_meal.toLocaleString("vi-VN")} VNĐ
                          </td>
                          <td className="px-4 py-3 text-slate-500">{cfg.notes || "-"}</td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditPriceConfig(cfg)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePriceConfig(cfg)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                            >
                              ❌ Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEAL ABSENCES */}
          {activeTab === "ABSENCES" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Đợt Lưu Trú (Stay Active)
                  </label>
                  <select
                    value={selectedStayId}
                    onChange={(e) => setSelectedStayId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-bold outline-none"
                  >
                    {stays.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stay #{s.id} — {getEmpName(s.employee_id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày vắng ăn
                  </label>
                  <input
                    type="date"
                    value={absDate}
                    onChange={(e) => setAbsDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lý do vắng</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={absReason}
                      onChange={(e) => setAbsReason(e.target.value)}
                      placeholder="VD: Về nước tạm thời / Di chuyển ngoài..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white outline-none"
                    />
                    <button
                      onClick={handleCreateAbsence}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap"
                    >
                      + Thêm Vắng
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
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
                        <tr key={abs.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">#{abs.id}</td>
                          <td className="px-4 py-3 font-mono font-bold">#{abs.stay_id}</td>
                          <td className="px-4 py-3 font-mono font-extrabold text-rose-700">
                            {abs.absence_date}
                          </td>
                          <td className="px-4 py-3">{abs.reason || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteAbsence(abs.id)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
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
