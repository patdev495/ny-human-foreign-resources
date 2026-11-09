import { useState, useEffect, useCallback } from "react";
import { Plus, RotateCcw } from "lucide-react";
import type { RoomOccupancy, ResidentInfo, ForeignEmployee } from "../types";
import { fetchRoomOccupancy, fetchEmployees } from "../api";
import { CheckInModal } from "./CheckInModal";
import { CheckOutModal } from "./CheckOutModal";
import { UnassignedEmployeesAlert } from "./room-occupancy/UnassignedEmployeesAlert";
import { GroupedRoomOccupancyView } from "./room-occupancy/GroupedRoomOccupancyView";
import { FlatResidentTableView } from "./room-occupancy/FlatResidentTableView";
import { OccupancyToolbar, type AccommodationFilter, type OccupancyView } from "./room-occupancy/OccupancyToolbar";
import { systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";

export function RoomOccupancyBoard() {
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<AccommodationFilter>("ALL");
  const [viewMode, setViewMode] = useState<OccupancyView>("GROUPED");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedEmpIdForCheckIn, setSelectedEmpIdForCheckIn] = useState<number | undefined>(undefined);
  const [targetResident, setTargetResident] = useState<ResidentInfo | null>(null);
  const [targetUnitName, setTargetUnitName] = useState("");

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const [occData, empData] = await Promise.all([fetchRoomOccupancy(), fetchEmployees()]);
      setOccupancy(occData);
      setEmployees(empData);
    } catch {
      setLoadError("Không thể tải hiện trạng chỗ ở. Kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleOpenCheckInForEmployee = (empId?: number): void => {
    setSelectedEmpIdForCheckIn(empId);
    setIsCheckInOpen(true);
  };
  const handleOpenCheckOut = (res: ResidentInfo, unitName: string): void => {
    setTargetResident(res);
    setTargetUnitName(unitName);
    setIsCheckOutOpen(true);
  };

  const unassignedEmployees = employees.filter((emp) => {
    const upcomingArrival = Boolean(
      emp.entry_date && emp.entry_date > new Date().toISOString().split("T")[0]
    );
    if ((!emp.is_in_vietnam && !upcomingArrival) || emp.current_room_number) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (emp.name_latin && emp.name_latin.toLowerCase().includes(q)) ||
      (emp.name_chinese && emp.name_chinese.toLowerCase().includes(q)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.passport_number && emp.passport_number.toLowerCase().includes(q))
    );
  });

  const filteredOccupancy = occupancy
    .filter((item) => {
      if (filterType === "KTX") return item.accommodation_type === "KTX";
      if (filterType === "HOTEL") return item.accommodation_type === "HOTEL";
      return true;
    })
    .map((item) => {
      if (!searchQuery.trim()) return item;
      const q = searchQuery.toLowerCase();
      const isHotel = item.accommodation_type === "HOTEL";
      const unitName = isHotel ? item.unit_name : `Phòng ${item.unit_name}`;
      const unitMatches =
        unitName.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesResident = (res: ResidentInfo) => {
        if (unitMatches) return true;
        const emp = employees.find((e) => e.id === res.employee_id);
        return (
          (res.name_latin && res.name_latin.toLowerCase().includes(q)) ||
          (res.name_chinese && res.name_chinese.toLowerCase().includes(q)) ||
          (res.passport_number && res.passport_number.toLowerCase().includes(q)) ||
          (emp?.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
          (res.bed_location && res.bed_location.toLowerCase().includes(q))
        );
      };

      return {
        ...item,
        active_residents: item.active_residents.filter(matchesResident),
        scheduled_residents: item.scheduled_residents.filter(matchesResident),
      };
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const isHotel = item.accommodation_type === "HOTEL";
      const unitName = isHotel ? item.unit_name : `Phòng ${item.unit_name}`;
      const unitMatches =
        unitName.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return unitMatches || item.active_residents.length > 0 || item.scheduled_residents.length > 0;
    });

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600" role="status">
        {loading ? "Đang tải hiện trạng chỗ ở…" : loadError ? "Chưa tải được hiện trạng" : <>
          <span className="font-medium tabular-nums text-slate-900">{occupancy.reduce((sum, unit) => sum + unit.active_count, 0)}</span> người đang ở
          <span className="mx-2 text-slate-400">·</span>{occupancy.reduce((sum, unit) => sum + unit.scheduled_count, 0)} người sắp đến
        </>}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void loadData()} disabled={loading} className={systemSecondaryButton}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới
        </button>
        <button type="button" onClick={() => handleOpenCheckInForEmployee()} className={systemPrimaryButton}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Xếp chỗ ở
        </button>
      </div>
    </div>
    <OccupancyToolbar occupancy={occupancy} ready={!loading && !loadError} filterType={filterType} onFilter={setFilterType}
      viewMode={viewMode} onView={setViewMode} searchQuery={searchQuery} onSearch={setSearchQuery} />
    {loading ? <div className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải danh sách chỗ ở…</div>
      : loadError ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-5 text-sm">
        <p className="text-red-800">{loadError}</p>
        <button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} mt-3`}>Thử lại</button>
      </div> : <>
        <UnassignedEmployeesAlert unassignedEmployees={unassignedEmployees} onCheckIn={handleOpenCheckInForEmployee} />
        {viewMode === "GROUPED" ? <GroupedRoomOccupancyView filteredOccupancy={filteredOccupancy} onCheckOut={handleOpenCheckOut} />
          : <FlatResidentTableView filteredOccupancy={filteredOccupancy} employees={employees} onCheckOut={handleOpenCheckOut} />}
      </>}
    <CheckInModal isOpen={isCheckInOpen} onClose={() => { setIsCheckInOpen(false); setSelectedEmpIdForCheckIn(undefined); }}
      onSuccess={loadData} defaultEmployeeId={selectedEmpIdForCheckIn} />
    <CheckOutModal isOpen={isCheckOutOpen} onClose={() => { setIsCheckOutOpen(false); setTargetResident(null); }}
      onSuccess={loadData} targetResident={targetResident} unitName={targetUnitName} />
  </div>;
}
