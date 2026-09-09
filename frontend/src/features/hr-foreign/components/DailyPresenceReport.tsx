import React, { useEffect, useState } from "react";
import { fetchDailyPresenceReport } from "../api";
import type { DailyPresenceReportResponse } from "../types";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { PresenceKpiHeader } from "./daily-presence/PresenceKpiHeader";
import { GroupedPresenceView } from "./daily-presence/GroupedPresenceView";
import { PresenceTableList } from "./daily-presence/PresenceTableList";
import { ExitedPresenceTable } from "./daily-presence/ExitedPresenceTable";

export const DailyPresenceReport: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [targetDate, setTargetDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<DailyPresenceReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mainTab, setMainTab] = useState<"IN_VN" | "EXITED">("IN_VN");
  const [activeSubTab, setActiveSubTab] = useState<"ALL" | "KTX" | "HOTEL" | "UNASSIGNED">("ALL");
  const [viewMode, setViewMode] = useState<"GROUPED" | "LIST">("LIST");

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

  const filteredItems = (data?.items || [])
    .filter((item) => {
      if (!matchesSearch(item)) return false;
      if (activeSubTab === "KTX") return item.accommodation_type === "KTX" && item.room_number;
      if (activeSubTab === "HOTEL") return item.accommodation_type === "HOTEL" && item.hotel_name;
      if (activeSubTab === "UNASSIGNED") return !item.room_number && !item.hotel_name;
      return true;
    })
    .sort((a, b) => {
      const aUnassigned = !a.room_number && !a.hotel_name ? 0 : 1;
      const bUnassigned = !b.room_number && !b.hotel_name ? 0 : 1;
      return aUnassigned - bUnassigned;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="workspace-module-header workspace-accommodation bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Thống kê Hiện diện & Chỗ ở</h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-semibold border border-white/30">
                Hàng ngày
              </span>
            </div>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">
              Tra cứu số lượng & vị trí lưu trú của nhân sự nước ngoài đang có mặt tại Việt Nam.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center bg-sky-950/25 backdrop-blur-xs p-1 rounded-xl border border-sky-400/30">
            <button
              onClick={() => setOffsetDate(-1)}
              className="px-2.5 py-1 text-xs font-semibold text-sky-100 hover:text-white hover:bg-white/15 rounded-lg transition-all"
              title="Hôm qua"
            >
              &larr;
            </button>
            <button
              onClick={() => setTargetDate(getTodayStr())}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                targetDate === getTodayStr()
                  ? "bg-white text-sky-800 shadow-xs font-extrabold"
                  : "text-sky-100 hover:text-white hover:bg-white/15"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setOffsetDate(1)}
              className="px-2.5 py-1 text-xs font-semibold text-sky-100 hover:text-white hover:bg-white/15 rounded-lg transition-all"
              title="Ngày mai"
            >
              &rarr;
            </button>
          </div>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ colorScheme: "light", color: "#0f172a" }}
            className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs cursor-pointer [color-scheme:light]"
          />
        </div>
      </div>

      {data && (
        <PresenceKpiHeader
          data={data}
          mainTab={mainTab}
          setMainTab={setMainTab}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
        />
      )}

      {/* Tabs & Search controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {mainTab === "IN_VN" ? (
            <>
              <button
                onClick={() => setActiveSubTab("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSubTab === "ALL"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả ({data?.summary.total_in_vn || 0})
              </button>
              <button
                onClick={() => setActiveSubTab("KTX")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSubTab === "KTX"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🏢 Ký túc xá ({data?.summary.ktx_count || 0})
              </button>
              <button
                onClick={() => setActiveSubTab("HOTEL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSubTab === "HOTEL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🏨 Khách sạn ({data?.summary.hotel_count || 0})
              </button>
              {(data?.summary.unassigned_count || 0) > 0 && (
                <button
                  onClick={() => setActiveSubTab("UNASSIGNED")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeSubTab === "UNASSIGNED"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ⚠️ Chưa xếp phòng ({data?.summary.unassigned_count})
                </button>
              )}
            </>
          ) : (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
              ✈️ Danh sách Đã về nước ({data?.summary.exited_count || 0})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {mainTab === "IN_VN" && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("LIST")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "LIST"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ☰ Bảng chi tiết
              </button>
              <button
                onClick={() => setViewMode("GROUPED")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "GROUPED"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ❖ Phân nhóm chỗ ở
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Đang tải báo cáo hiện diện...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-lg">
          {error}
        </div>
      ) : mainTab === "IN_VN" ? (
        viewMode === "GROUPED" ? (
          <GroupedPresenceView
            activeSubTab={activeSubTab}
            ktxGroups={filteredKtxGroups}
            hotelGroups={filteredHotelGroups}
            unassignedItems={filteredUnassignedItems}
            onOpenProfile={handleOpenProfile}
          />
        ) : (
          <PresenceTableList
            filteredItems={filteredItems}
            onOpenProfile={handleOpenProfile}
          />
        )
      ) : (
        <ExitedPresenceTable
          filteredExitedItems={filteredExitedItems}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {selectedEmpId && (
        <EmployeeProfileModal
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            loadReport(targetDate);
          }}
          onUpdate={() => loadReport(targetDate)}
          employeeId={selectedEmpId}
        />
      )}
    </div>
  );
};
