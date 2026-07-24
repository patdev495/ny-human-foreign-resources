import React, { useState, useEffect } from "react";
import type { RoomOccupancy, ResidentInfo, ForeignEmployee } from "../types";
import { fetchRoomOccupancy, fetchEmployees } from "../api";
import { CheckInModal } from "./CheckInModal";
import { CheckOutModal } from "./CheckOutModal";
import { UnassignedEmployeesAlert } from "./room-occupancy/UnassignedEmployeesAlert";
import { GroupedRoomOccupancyView } from "./room-occupancy/GroupedRoomOccupancyView";
import { FlatResidentTableView } from "./room-occupancy/FlatResidentTableView";

export const RoomOccupancyBoard: React.FC = () => {
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "KTX" | "HOTEL">("ALL");
  const [viewMode, setViewMode] = useState<"GROUPED" | "LIST">("LIST");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [selectedEmpIdForCheckIn, setSelectedEmpIdForCheckIn] = useState<number | undefined>(undefined);
  const [targetResident, setTargetResident] = useState<ResidentInfo | null>(null);
  const [targetUnitName, setTargetUnitName] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [occData, empData] = await Promise.all([
        fetchRoomOccupancy(),
        fetchEmployees(),
      ]);
      setOccupancy(occData);
      setEmployees(empData);
    } catch (err) {
      console.error("Failed to fetch room occupancy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCheckInForEmployee = (empId?: number) => {
    setSelectedEmpIdForCheckIn(empId);
    setIsCheckInOpen(true);
  };

  const handleOpenCheckOut = (res: ResidentInfo, unitName: string) => {
    setTargetResident(res);
    setTargetUnitName(unitName);
    setIsCheckOutOpen(true);
  };

  const unassignedEmployees = employees.filter((emp) => {
    if (!emp.is_in_vietnam || emp.current_room_number) return false;
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

      const matchingResidents = item.active_residents.filter((res) => {
        if (unitMatches) return true;
        const emp = employees.find((e) => e.id === res.employee_id);
        return (
          (res.name_latin && res.name_latin.toLowerCase().includes(q)) ||
          (res.name_chinese && res.name_chinese.toLowerCase().includes(q)) ||
          (res.passport_number && res.passport_number.toLowerCase().includes(q)) ||
          (emp?.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
          (res.bed_location && res.bed_location.toLowerCase().includes(q))
        );
      });

      return { ...item, active_residents: matchingResidents };
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

      return unitMatches || item.active_residents.length > 0;
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sơ đồ Hiện trạng Chỗ ở (KTX & Khách sạn)</h2>
          <p className="text-sm text-slate-500">
            Xem trực quan nhân sự đang lưu trú active tại từng phòng KTX và Khách sạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenCheckInForEmployee(undefined)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            + Xếp người vào chỗ ở
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      <UnassignedEmployeesAlert
        unassignedEmployees={unassignedEmployees}
        onCheckIn={handleOpenCheckInForEmployee}
      />

      {/* Filter Tabs & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({occupancy.length})
          </button>
          <button
            onClick={() => setFilterType("KTX")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "KTX"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏫 KTX ({occupancy.filter((o) => o.accommodation_type === "KTX").length})
          </button>
          <button
            onClick={() => setFilterType("HOTEL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "HOTEL"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏨 Khách sạn ({occupancy.filter((o) => o.accommodation_type === "HOTEL").length})
          </button>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setViewMode("GROUPED")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "GROUPED"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏢 Theo Phòng
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👤 Theo Nhân viên
            </button>
          </div>

          <input
            type="text"
            placeholder="Tìm tên, mã, phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 sm:w-60 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Đang tải sơ đồ chỗ ở...</div>
      ) : viewMode === "GROUPED" ? (
        <GroupedRoomOccupancyView
          filteredOccupancy={filteredOccupancy}
          onCheckOut={handleOpenCheckOut}
        />
      ) : (
        <FlatResidentTableView
          filteredOccupancy={filteredOccupancy}
          employees={employees}
          onCheckOut={handleOpenCheckOut}
        />
      )}

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setSelectedEmpIdForCheckIn(undefined);
        }}
        onSuccess={loadData}
        defaultEmployeeId={selectedEmpIdForCheckIn}
      />

      <CheckOutModal
        isOpen={isCheckOutOpen}
        onClose={() => {
          setIsCheckOutOpen(false);
          setTargetResident(null);
        }}
        onSuccess={loadData}
        targetResident={targetResident}
        unitName={targetUnitName}
      />
    </div>
  );
};
