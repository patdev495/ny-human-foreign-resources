import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { fetchDailyPresenceReport } from "../api";
import type { DailyPresenceItem, DailyPresenceReportResponse } from "../types";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { GroupedPresenceView } from "./daily-presence/GroupedPresenceView";
import { PresenceTableList } from "./daily-presence/PresenceTableList";
import { ExitedPresenceTable } from "./daily-presence/ExitedPresenceTable";
import { PresenceToolbar, type PresenceScope, type PresenceAccommodation, type PresenceView } from "./daily-presence/PresenceToolbar";
import { vietnamDate } from "./meal-forecast/vietnamDate";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";

export function DailyPresenceReport() {
  const [targetDate, setTargetDate] = useState(vietnamDate);
  const [data, setData] = useState<DailyPresenceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState<PresenceScope>("IN_VN");
  const [activeSubTab, setActiveSubTab] = useState<PresenceAccommodation>("ALL");
  const [viewMode, setViewMode] = useState<PresenceView>("LIST");
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const requestSequence = useRef(0);

  const handleOpenProfile = (employeeId: number): void => {
    setSelectedEmpId(employeeId);
    setIsProfileOpen(true);
  };
  const loadReport = useCallback(async (date: string): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const report = await fetchDailyPresenceReport(date);
      if (sequence === requestSequence.current) setData(report);
    } catch (cause: unknown) {
      if (sequence === requestSequence.current) {
        console.error("Failed to load daily presence report:", cause);
        setError("Không thể tải thống kê hiện diện. Kiểm tra kết nối rồi thử lại.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadReport(targetDate);
    return () => { requestSequence.current += 1; };
  }, [targetDate, loadReport]);

  const setOffsetDate = (offsetDays: number): void => {
    const date = new Date(`${targetDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    setTargetDate(date.toISOString().slice(0, 10));
  };
  const currentData = !loading && !error && data?.target_date === targetDate ? data : null;
  const matchesSearch = (item: DailyPresenceItem): boolean => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return !query || [item.name_latin, item.name_chinese, item.employee_code, item.room_number, item.hotel_name, item.department]
      .some((value) => value?.toLocaleLowerCase().includes(query));
  };
  const filteredItems = (currentData?.items || []).filter((item) => {
    if (activeSubTab === "KTX") return Boolean(item.room_number);
    if (activeSubTab === "HOTEL") return Boolean(item.hotel_name);
    if (activeSubTab === "UNASSIGNED") return !item.room_number && !item.hotel_name;
    return true;
  }).filter(matchesSearch);
  const filteredKtxGroups = (currentData?.ktx_groups || []).map((group) => ({ ...group, items: group.items.filter(matchesSearch) })).filter((group) => group.items.length > 0);
  const filteredHotelGroups = (currentData?.hotel_groups || []).map((group) => ({ ...group, items: group.items.filter(matchesSearch) })).filter((group) => group.items.length > 0);
  const filteredUnassignedItems = (currentData?.unassigned_items || []).filter(matchesSearch);
  const filteredExitedItems = (currentData?.exited_items || []).filter(matchesSearch).sort((first, second) => {
    const firstUnassigned = !first.room_number && !first.hotel_name ? 0 : 1;
    const secondUnassigned = !second.room_number && !second.hotel_name ? 0 : 1;
    return firstUnassigned - secondUnassigned;
  });

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Thống kê hiện diện</h1>
      <div className="flex flex-wrap items-end gap-2">
        <div><label htmlFor="presence-date" className="mb-1.5 block text-sm text-slate-600">Ngày tra cứu</label>
          <input id="presence-date" type="date" required value={targetDate} onChange={(event) => { if (event.target.value) setTargetDate(event.target.value); }} className={`${systemField} w-auto`} /></div>
        <button type="button" onClick={() => setOffsetDate(-1)} aria-label="Ngày trước" className={systemSecondaryButton}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => setTargetDate(vietnamDate())} className={systemSecondaryButton}>Hôm nay</button>
        <button type="button" onClick={() => setOffsetDate(1)} aria-label="Ngày sau" className={systemSecondaryButton}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => void loadReport(targetDate)} disabled={loading} className={systemSecondaryButton}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới</button>
      </div>
    </div>
    <PresenceToolbar summary={currentData?.summary ?? null} scope={mainTab} onScope={setMainTab}
      accommodation={activeSubTab} onAccommodation={setActiveSubTab} view={viewMode} onView={setViewMode} query={searchQuery} onQuery={setSearchQuery} />
    <div aria-busy={loading}>
      {error ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-5 text-sm">
        <p className="text-red-800">{error}</p><button type="button" onClick={() => void loadReport(targetDate)} className={`${systemSecondaryButton} mt-3`}>Thử lại</button>
      </div> : !currentData ? <div role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải thống kê hiện diện…</div>
        : mainTab === "EXITED" ? <ExitedPresenceTable filteredExitedItems={filteredExitedItems} onOpenProfile={handleOpenProfile} />
          : viewMode === "LIST" ? <PresenceTableList filteredItems={filteredItems} onOpenProfile={handleOpenProfile} />
            : <GroupedPresenceView activeSubTab={activeSubTab} ktxGroups={filteredKtxGroups} hotelGroups={filteredHotelGroups} unassignedItems={filteredUnassignedItems} onOpenProfile={handleOpenProfile} />}
    </div>
    {selectedEmpId !== null && <EmployeeProfileModal isOpen={isProfileOpen} employeeId={selectedEmpId}
      onClose={() => { setIsProfileOpen(false); void loadReport(targetDate); }} onUpdate={() => void loadReport(targetDate)} />}
  </div>;
}
