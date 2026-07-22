import React, { useEffect, useState } from "react";
import { fetchDailyPresenceReport } from "../api";
import type { DailyPresenceReportResponse } from "../types";

export const DailyPresenceReport: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [targetDate, setTargetDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<DailyPresenceReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"ALL" | "KTX" | "HOTEL">("ALL");

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

  const filteredItems = (data?.items || []).filter(matchesSearch);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total present */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                Đang có mặt tại VN
              </p>
              <h3 className="text-3xl font-extrabold mt-1">{data.summary.total_in_vn}</h3>
              <p className="text-[11px] text-blue-200 mt-1">Ngày: {data.target_date}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black backdrop-blur-xs">
              🇻🇳
            </div>
          </div>

          {/* KTX Count */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tại Ký túc xá (KTX)
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {data.summary.ktx_count}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {data.ktx_groups.length} phòng đang có người ở
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-emerald-100">
              🏢
            </div>
          </div>

          {/* Hotel Count */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
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
        </div>
      )}

      {/* Filter and Tab Options */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab("ALL")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial text-center ${
              activeSubTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab("KTX")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial text-center ${
              activeSubTab === "KTX"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chỉ KTX ({data?.summary.ktx_count || 0})
          </button>
          <button
            onClick={() => setActiveSubTab("HOTEL")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-initial text-center ${
              activeSubTab === "HOTEL"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chỉ Khách sạn ({data?.summary.hotel_count || 0})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
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
          {/* 1. KTX Grouped View */}
          {(activeSubTab === "ALL" || activeSubTab === "KTX") && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Ký túc xá ({filteredKtxGroups.reduce((acc, g) => acc + g.items.length, 0)} người)</span>
              </h3>

              {filteredKtxGroups.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                  Không có nhân sự nào tại KTX trong ngày này.
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
                            <span className="text-lg">🚪</span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              Phòng {group.group_name}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {group.items.length} người
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((emp) => (
                            <div
                              key={emp.employee_id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-emerald-50/40 transition-colors"
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
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                  {emp.bed_location || "Chưa chọn giường"}
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

          {/* 2. Hotel Grouped View */}
          {(activeSubTab === "ALL" || activeSubTab === "HOTEL") && (
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Khách sạn ({filteredHotelGroups.reduce((acc, g) => acc + g.items.length, 0)} người)</span>
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
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {group.items.length} người
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((emp) => (
                            <div
                              key={emp.employee_id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-amber-50/40 transition-colors"
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
        </div>
      )}
    </div>
  );
};
