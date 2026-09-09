import React, { useEffect, useState } from "react";
import {
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  Hotel,
  AlertTriangle,
  PlaneTakeoff,
  List,
  LayoutGrid,
} from "lucide-react";
import { fetchDailyPresenceReport } from "../api";
import type { DailyPresenceReportResponse } from "../types";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { PresenceKpiHeader } from "./daily-presence/PresenceKpiHeader";
import { GroupedPresenceView } from "./daily-presence/GroupedPresenceView";
import { PresenceTableList } from "./daily-presence/PresenceTableList";
import { ExitedPresenceTable } from "./daily-presence/ExitedPresenceTable";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải báo cáo thống kê hiện diện";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(targetDate);
  }, [targetDate]);

  const setOffsetDate = (offsetDays: number) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + offsetDays);
    setTargetDate(d.toISOString().split("T")[0]);
  };

  const matchesSearch = (item: {
    employee_code?: string | null;
    name_latin: string;
    room_number?: string | null;
    hotel_name?: string | null;
    department?: string | null;
  }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name_latin.toLowerCase().includes(q) ||
      (item.employee_code && item.employee_code.toLowerCase().includes(q)) ||
      (item.room_number && item.room_number.toLowerCase().includes(q)) ||
      (item.hotel_name && item.hotel_name.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q))
    );
  };

  const filteredItems = (data?.items || [])
    .filter((it) => {
      if (activeSubTab === "KTX") return Boolean(it.room_number);
      if (activeSubTab === "HOTEL") return Boolean(it.hotel_name);
      if (activeSubTab === "UNASSIGNED") return !it.room_number && !it.hotel_name;
      return true;
    })
    .filter(matchesSearch);

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

  const filteredExitedItems = (data?.exited_items || [])
    .filter(matchesSearch)
    .sort((a, b) => {
      const aUnassigned = !a.room_number && !a.hotel_name ? 0 : 1;
      const bUnassigned = !b.room_number && !b.hotel_name ? 0 : 1;
      return aUnassigned - bUnassigned;
    });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <ModuleHeader
        title="Thống kê Hiện diện & Chỗ ở"
        subtitle="Tra cứu số lượng & vị trí lưu trú của nhân sự nước ngoài đang có mặt tại Việt Nam."
        icon={UserCheck}
        theme="indigo"
        badgeText="Theo ngày"
      >
        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-950/40 p-1 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setOffsetDate(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Hôm qua"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTargetDate(getTodayStr())}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                targetDate === getTodayStr()
                  ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setOffsetDate(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Ngày mai"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-9 px-3 text-xs font-mono font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          />
        </div>
      </ModuleHeader>

      {data && (
        <PresenceKpiHeader
          data={data}
          mainTab={mainTab}
          setMainTab={setMainTab}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
        />
      )}

      {/* Modern Filter Toolbar */}
      <div className="modern-card p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {mainTab === "IN_VN" ? (
            <>
              <button
                type="button"
                onClick={() => setActiveSubTab("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả ({data?.summary.total_in_vn || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("KTX")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === "KTX"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Ký túc xá ({data?.summary.ktx_count || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("HOTEL")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === "HOTEL"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Hotel className="h-3.5 w-3.5" />
                <span>Khách sạn ({data?.summary.hotel_count || 0})</span>
              </button>
              {(data?.summary.unassigned_count || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab("UNASSIGNED")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeSubTab === "UNASSIGNED"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Chưa xếp phòng ({data?.summary.unassigned_count})</span>
                </button>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              <PlaneTakeoff className="h-4 w-4" />
              <span>Danh sách Đã về nước ({data?.summary.exited_count || 0})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {mainTab === "IN_VN" && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "LIST"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GROUPED")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === "GROUPED"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Nhóm</span>
              </button>
            </div>
          )}

          <div className="relative w-full md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Tìm tên, mã, phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="modern-card p-12 text-center text-slate-400">
          <div className="workspace-skeleton h-12 w-full mb-3" />
          <div className="workspace-skeleton h-12 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
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
