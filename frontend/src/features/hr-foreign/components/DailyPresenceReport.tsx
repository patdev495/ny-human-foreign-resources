import React, { useEffect, useState } from "react";
import { fetchDailyPresenceReport } from "../api";
import type { DailyPresenceReportResponse, DailyPresenceItem } from "../types";
import { EmployeeProfileModal } from "./EmployeeProfileModal";

export const DailyPresenceReport: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [targetDate, setTargetDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<DailyPresenceReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mainTab, setMainTab] = useState<"IN_VN" | "EXITED">("IN_VN");
  const [activeSubTab, setActiveSubTab] = useState<"ALL" | "KTX" | "HOTEL" | "UNASSIGNED">("ALL");
  const [viewMode, setViewMode] = useState<"GROUPED" | "LIST">("GROUPED");

  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleOpenProfile = (empId: number) => {
    setSelectedEmpId(empId);
    setIsProfileOpen(true);
  };

  const loadReport = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDailyPresenceReport(date);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Không thể tải báo cáo thống kê hiện diện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(targetDate);
  }, [targetDate]);

  const setOffsetDate = (days: number) => {
    const d = new Date(targetDate || getTodayStr());
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split("T")[0]);
  };

  // Filter items by search query
  const matchesSearch = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.name_latin && item.name_latin.toLowerCase().includes(q)) ||
      (item.name_chinese && item.name_chinese.toLowerCase().includes(q)) ||
      (item.employee_code && item.employee_code.toLowerCase().includes(q)) ||
      (item.location_name && item.location_name.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q))
    );
  };

  const filteredKtxGroups = (data?.ktx_groups || [])
    .map((g) => ({
      ...g,
      items: g.items.filter(matchesSearch),
    }))
    .filter((g) => g.items.length > 0);

  const filteredHotelGroups = (data?.hotel_groups || [])
    .map((g) => ({
      ...g,
      items: g.items.filter(matchesSearch),
    }))
    .filter((g) => g.items.length > 0);

  const filteredUnassignedItems = (data?.unassigned_items || []).filter(matchesSearch);
  const filteredExitedItems = (data?.exited_items || []).filter(matchesSearch);

  const filteredItems = (data?.items || []).filter((item) => {
    if (!matchesSearch(item)) return false;
    if (activeSubTab === "KTX") return item.accommodation_type === "KTX" && item.room_number;
    if (activeSubTab === "HOTEL") return item.accommodation_type === "HOTEL" && item.hotel_name;
    if (activeSubTab === "UNASSIGNED") return !item.room_number && !item.hotel_name;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Thống kê Hiện diện & Chỗ ở</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
              Hàng ngày
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu số lượng & vị trí lưu trú của nhân sự nước ngoài đang có mặt tại Việt Nam.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setOffsetDate(-1)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              title="Hôm qua"
            >
              &larr;
            </button>
            <button
              onClick={() => setTargetDate(getTodayStr())}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                targetDate === getTodayStr()
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setOffsetDate(1)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              title="Ngày mai"
            >
              &rarr;
            </button>
          </div>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total present */}
          <div
            onClick={() => {
              setMainTab("IN_VN");
              setActiveSubTab("ALL");
            }}
            title="Bấm để xem tất cả nhân sự đang có mặt tại VN"
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
              mainTab === "IN_VN" && activeSubTab === "ALL"
                ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50/30 shadow-xs"
                : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Đang ở Việt Nam
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {data.summary.total_in_vn}
              </h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">
                Ngày: {data.target_date}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-blue-100">
              🇻🇳
            </div>
          </div>

          {/* KTX Count */}
          <div
            onClick={() => {
              setMainTab("IN_VN");
              setActiveSubTab("KTX");
            }}
            title="Bấm để lọc nhân sự ở Ký túc xá"
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
              mainTab === "IN_VN" && activeSubTab === "KTX"
                ? "border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/30 shadow-xs"
                : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tại Ký túc xá (KTX)
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {data.summary.ktx_count}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {data.ktx_groups.length} phòng đang ở
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-emerald-100">
              🏢
            </div>
          </div>

          {/* Hotel Count */}
          <div
            onClick={() => {
              setMainTab("IN_VN");
              setActiveSubTab("HOTEL");
            }}
            title="Bấm để lọc nhân sự ở Khách sạn"
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
              mainTab === "IN_VN" && activeSubTab === "HOTEL"
                ? "border-amber-500 ring-2 ring-amber-500 bg-amber-50/30 shadow-xs"
                : "border-slate-200 hover:border-amber-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tại Khách sạn
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {data.summary.hotel_count}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                {data.hotel_groups.length} cơ sở lưu trú
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-amber-100">
              🏨
            </div>
          </div>

          {/* Exited Count */}
          <div
            onClick={() => setMainTab("EXITED")}
            title="Bấm để xem danh sách nhân sự đã về nước"
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
              mainTab === "EXITED"
                ? "border-rose-500 ring-2 ring-rose-500 bg-rose-50/30 shadow-xs"
                : "border-slate-200 hover:border-rose-300"
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Đã về nước (Ở nước ngoài)
              </p>
              <h3 className="text-3xl font-extrabold text-rose-700 mt-1">
                {data.summary.exited_count || 0}
              </h3>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Bấm để xem danh sách
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-rose-100">
              ✈️
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setMainTab("IN_VN")}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            mainTab === "IN_VN"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🇻🇳 Đang ở Việt Nam</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
            {data?.summary.total_in_vn || 0}
          </span>
        </button>
        <button
          onClick={() => setMainTab("EXITED")}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
            mainTab === "EXITED"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>✈️ Đã về nước</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800 font-bold">
            {data?.summary.exited_count || 0}
          </span>
        </button>
      </div>

      {/* Filter and View Mode Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subtabs Filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({data?.summary.total_in_vn || 0})
          </button>
          <button
            onClick={() => setActiveSubTab("KTX")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === "KTX"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chỉ KTX ({data?.summary.ktx_count || 0})
          </button>
          <button
            onClick={() => setActiveSubTab("HOTEL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === "HOTEL"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chỉ Khách sạn ({data?.summary.hotel_count || 0})
          </button>
          <button
            onClick={() => setActiveSubTab("UNASSIGNED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === "UNASSIGNED"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chưa xếp phòng ({data?.summary.unassigned_count || 0})
          </button>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("GROUPED")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "GROUPED"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🏢</span> Theo Phòng
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👤</span> Theo Nhân viên
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-48 sm:w-64">
            <input
              type="text"
              placeholder="Tìm tên, mã, phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Đang tải báo cáo hiện diện...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Content Display */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {mainTab === "EXITED" ? (
            /* --- ✈️ EXITED TAB CONTENT (Danh sách nhân sự đã về nước) --- */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-rose-50/60 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                    <span>✈️ Danh sách Nhân sự Đã về nước (Ở nước ngoài) — {filteredExitedItems.length} người</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Danh sách nhân viên không có mặt tại Việt Nam tính đến ngày {data.target_date}.
                  </p>
                </div>
                {/* Search Bar for Exited */}
                <div className="relative w-48 sm:w-64">
                  <input
                    type="text"
                    placeholder="Tìm tên, mã, bộ phận..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {filteredExitedItems.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Không có nhân sự nào đã về nước (hoặc phù hợp tìm kiếm) tại thời điểm này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Nhân viên</th>
                        <th className="px-4 py-3">Bộ phận</th>
                        <th className="px-4 py-3">✈️ Ngày thực tế đã về</th>
                        <th className="px-4 py-3">⏳ Ngày dự kiến sang đợt tới</th>
                        <th className="px-4 py-3">Ghi chú</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredExitedItems.map((emp: DailyPresenceItem) => (
                        <tr
                          key={emp.employee_id}
                          className="hover:bg-rose-50/30 transition-colors cursor-pointer"
                          onClick={() => handleOpenProfile(emp.employee_id)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block text-xs">{emp.name_latin}</span>
                            {emp.name_chinese && (
                              <span className="text-slate-400 text-[11px] font-normal block">{emp.name_chinese}</span>
                            )}
                            {emp.employee_code && (
                              <span className="text-[10px] font-mono text-blue-600 block mt-0.5">{emp.employee_code}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{emp.department || "-"}</td>
                          <td className="px-4 py-3 font-mono font-bold text-rose-700">
                            {emp.actual_exit_date || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">
                            {emp.expected_entry_date || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                            {emp.notes || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProfile(emp.employee_id);
                              }}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Xem Profile 360°
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* --- 🇻🇳 IN_VN TAB CONTENT --- */
            <>
              {viewMode === "LIST" ? (
                /* --- 👤 LIST VIEW MODE --- */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span>👤 Danh sách nhân sự hiện diện ({filteredItems.length} người)</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">Ngày: {data.target_date}</span>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Không tìm thấy nhân sự phù hợp với bộ lọc.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Tên nhân sự</th>
                            <th className="px-4 py-3">Bộ phận</th>
                            <th className="px-4 py-3">Loại chỗ ở</th>
                            <th className="px-4 py-3">Địa điểm cụ thể</th>
                            <th className="px-4 py-3 text-center">Vị trí giường</th>
                            <th className="px-4 py-3 text-center">Ngày bắt đầu</th>
                            <th className="px-4 py-3 text-center">Dự kiến về</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.map((emp) => (
                            <tr
                              key={emp.employee_id}
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => handleOpenProfile(emp.employee_id)}
                            >
                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-900 block">{emp.name_latin}</span>
                                {emp.name_chinese && (
                                  <span className="text-slate-400 text-[11px] font-normal">{emp.name_chinese}</span>
                                )}
                                {emp.employee_code && (
                                  <span className="text-[10px] font-mono text-blue-600 block mt-0.5">{emp.employee_code}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{emp.department || "N/A"}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {emp.room_number ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    🏢 KTX
                                  </span>
                                ) : emp.hotel_name ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    🏨 Khách sạn
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    ❓ Chưa xếp
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{emp.location_name}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-600">{emp.bed_location || "-"}</td>
                              <td className="px-4 py-3 text-center font-mono">{emp.start_date || "-"}</td>
                              <td className="px-4 py-3 text-center font-mono font-medium text-amber-700">{emp.expected_end_date || "-"}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenProfile(emp.employee_id);
                                  }}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Profile 360°
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* --- 🏢 GROUPED VIEW MODE (Theo Phòng / Cơ sở) --- */
                <div className="space-y-6">
                  {/* KTX Groups */}
                  {(activeSubTab === "ALL" || activeSubTab === "KTX") && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span>🏢 Các phòng Ký túc xá ({filteredKtxGroups.length} phòng)</span>
                      </h3>

                      {filteredKtxGroups.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                          Không có nhân sự nào lưu trú tại KTX trong ngày này.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredKtxGroups.map((group) => (
                            <div
                              key={group.group_name}
                              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🏢</span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                      Phòng {group.group_name}
                                    </span>
                                  </div>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {group.items.length} người
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {group.items.map((emp) => (
                                    <div
                                      key={emp.employee_id}
                                      onClick={() => handleOpenProfile(emp.employee_id)}
                                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-xs font-bold text-slate-900">
                                            {emp.name_latin}
                                            {emp.name_chinese && (
                                              <span className="text-slate-500 font-normal ml-1">
                                                ({emp.name_chinese})
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            {emp.employee_code || "Chưa có mã"} &bull; {emp.department || "N/A"}
                                          </p>
                                        </div>
                                        {emp.bed_location && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                                            {emp.bed_location}
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                                        <span>Từ: {emp.start_date || "N/A"}</span>
                                        {emp.expected_end_date && (
                                          <span className="text-amber-700 font-medium">
                                            Dự kiến về: {emp.expected_end_date}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hotel Groups */}
                  {(activeSubTab === "ALL" || activeSubTab === "HOTEL") && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span>🏨 Cơ sở Khách sạn ({filteredHotelGroups.length} cơ sở)</span>
                      </h3>

                      {filteredHotelGroups.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                          Không có nhân sự nào lưu trú tại Khách sạn trong ngày này.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredHotelGroups.map((group) => (
                            <div
                              key={group.group_name}
                              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🏨</span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                      {group.group_name}
                                    </span>
                                  </div>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    {group.items.length} người
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {group.items.map((emp) => (
                                    <div
                                      key={emp.employee_id}
                                      onClick={() => handleOpenProfile(emp.employee_id)}
                                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-amber-50/40 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-xs font-bold text-slate-900">
                                            {emp.name_latin}
                                            {emp.name_chinese && (
                                              <span className="text-slate-500 font-normal ml-1">
                                                ({emp.name_chinese})
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            {emp.employee_code || "Chưa có mã"} &bull; {emp.department || "N/A"}
                                          </p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                          P.{emp.hotel_room_number || "Chưa ghi"}
                                        </span>
                                      </div>

                                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                                        <span>Từ: {emp.start_date || "N/A"}</span>
                                        {emp.expected_end_date && (
                                          <span className="text-amber-700 font-medium">
                                            Dự kiến về: {emp.expected_end_date}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unassigned Section */}
                  {(activeSubTab === "ALL" || activeSubTab === "UNASSIGNED") && filteredUnassignedItems.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
                        <span>⚠️ Nhân sự chưa xếp chỗ ở ({filteredUnassignedItems.length} người)</span>
                      </h3>

                      <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-rose-50 text-rose-900 font-semibold border-b border-rose-200">
                              <tr>
                                <th className="px-4 py-3">Tên nhân sự</th>
                                <th className="px-4 py-3">Bộ phận</th>
                                <th className="px-4 py-3">Số điện thoại</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100">
                              {filteredUnassignedItems.map((emp) => (
                                <tr
                                  key={emp.employee_id}
                                  onClick={() => handleOpenProfile(emp.employee_id)}
                                  className="hover:bg-rose-50/40 transition-colors cursor-pointer"
                                >
                                  <td className="px-4 py-3 font-bold text-slate-900">{emp.name_latin}</td>
                                  <td className="px-4 py-3 text-slate-600">{emp.department || "N/A"}</td>
                                  <td className="px-4 py-3 font-mono">{emp.phone || "-"}</td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenProfile(emp.employee_id);
                                      }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                                    >
                                      Profile 360°
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Employee 360 Profile Modal */}
      {selectedEmpId && (
        <EmployeeProfileModal
          employeeId={selectedEmpId}
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedEmpId(null);
            loadReport(targetDate);
          }}
        />
      )}
    </div>
  );
};
