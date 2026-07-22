import React, { useState, useEffect } from "react";
import type { RoomOccupancy, ResidentInfo, ForeignEmployee } from "../types";
import { fetchRoomOccupancy, fetchEmployees } from "../api";
import { CheckInModal } from "./CheckInModal";
import { CheckOutModal } from "./CheckOutModal";

export const RoomOccupancyBoard: React.FC = () => {
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "KTX" | "HOTEL">("ALL");
  const [viewMode, setViewMode] = useState<"GROUPED" | "LIST">("GROUPED");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
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

      return {
        ...item,
        active_residents: matchingResidents,
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

      return unitMatches || item.active_residents.length > 0;
    });

  const totalResidents = filteredOccupancy.reduce(
    (sum, r) => sum + r.active_residents.length,
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
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
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Xếp người vào chỗ ở
          </button>

          <button
            onClick={loadData}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Unassigned Employees Section */}
      {unassignedEmployees.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <h3 className="text-sm font-bold text-amber-900">
                Cảnh báo: Có {unassignedEmployees.length} nhân sự đang ở Việt Nam nhưng CHƯA ĐƯỢC XẾP CHỖ Ở
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Cần xếp chỗ ngay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{emp.name_latin}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {emp.employee_code || "Chưa có mã"} &bull; {emp.department || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCheckInForEmployee(emp.id)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
                >
                  + Xếp chỗ ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Summary stats & View Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả chỗ ở ({occupancy.length})
          </button>
          <button
            onClick={() => setFilterType("KTX")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "KTX"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏫 Phòng KTX ({occupancy.filter((o) => o.accommodation_type === "KTX").length})
          </button>
          <button
            onClick={() => setFilterType("HOTEL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "HOTEL"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏨 Khách sạn ({occupancy.filter((o) => o.accommodation_type === "HOTEL").length})
          </button>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
          {/* View Mode Switch */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setViewMode("GROUPED")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "GROUPED"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🏢</span> Theo Phòng
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👤</span> Theo Nhân viên
            </button>
          </div>

          {/* Search input box */}
          <div className="relative w-44 sm:w-60">
            <input
              type="text"
              placeholder="Tìm tên, mã, phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <span>Đang ở:</span>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-full">
              {totalResidents} người
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Display */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải hiện trạng chỗ ở...</div>
      ) : viewMode === "LIST" ? (
        /* --- 👤 LIST VIEW MODE (Theo danh sách nhân viên đang lưu trú) --- */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              👤 Danh sách Nhân sự Đang lưu trú ({totalResidents} người)
            </h3>
          </div>

          {totalResidents === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Chưa có nhân sự nào lưu trú.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Tên nhân sự</th>
                    <th className="px-4 py-3">Mã NV</th>
                    <th className="px-4 py-3">Loại chỗ ở</th>
                    <th className="px-4 py-3">Tên cơ sở / Phòng</th>
                    <th className="px-4 py-3 text-center">Giường / Phòng KS</th>
                    <th className="px-4 py-3 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOccupancy.flatMap((item) => {
                    const isHotel = item.accommodation_type === "HOTEL";
                    const unitName = isHotel ? item.unit_name : `Phòng ${item.unit_name}`;

                    return item.active_residents.map((res) => {
                      const emp = employees.find((e) => e.id === res.employee_id);
                      return (
                        <tr key={res.stay_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{res.name_latin}</td>
                          <td className="px-4 py-3 font-mono text-blue-600">{emp?.employee_code || "–"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isHotel ? (
                              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                🏨 Khách sạn
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                🏫 KTX
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{unitName}</td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {res.bed_location || "–"}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">{res.start_date || "–"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenCheckOut(res, unitName)}
                              className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-md transition-colors cursor-pointer"
                            >
                              Trả phòng
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : filteredOccupancy.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          Chưa có chỗ ở nào khớp với bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOccupancy.map((item) => {
            const isHotel = item.accommodation_type === "HOTEL";
            const hasPeople = item.active_residents.length > 0;
            const unitDisplayName = isHotel ? item.unit_name : `Phòng ${item.unit_name}`;

            return (
              <div
                key={`${item.accommodation_type}-${item.unit_id}`}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  hasPeople
                    ? isHotel
                      ? "bg-amber-50/20 border-amber-200 shadow-xs"
                      : "bg-white border-indigo-200 shadow-xs"
                    : "bg-slate-50/60 border-slate-200 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isHotel ? "bg-amber-500" : "bg-indigo-500"
                        }`}
                      ></span>
                      <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                        {unitDisplayName}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex-shrink-0 ${
                        hasPeople
                          ? isHotel
                            ? "bg-amber-100 text-amber-900"
                            : "bg-indigo-100 text-indigo-900"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {hasPeople ? `${item.active_residents.length} người` : "Đang trống"}
                    </span>
                  </div>

                  {isHotel && item.address && (
                    <div className="mt-2 text-xs text-slate-500 truncate flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {item.address}
                    </div>
                  )}

                  <div className="mt-3 space-y-2.5">
                    {hasPeople ? (
                      item.active_residents.map((res) => (
                        <div
                          key={res.stay_id}
                          className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-lg border border-slate-200/80 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900">
                              {res.name_latin}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {res.passport_number || ""}
                            </span>
                          </div>
                          {res.name_chinese && (
                            <div className="text-xs text-slate-600">{res.name_chinese}</div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">
                                {res.stay_type === "CO_DINH" ? "Cố định" : "Công tác"}
                              </span>
                              {res.bed_location && (
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {res.bed_location}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleOpenCheckOut(res, unitDisplayName)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center"
                              title="Trả phòng cho nhân sự này"
                            >
                              Trả phòng &rarr;
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Chưa có người lưu trú</p>
                    )}
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400 truncate">
                    {item.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={loadData}
        defaultEmployeeId={selectedEmpIdForCheckIn}
      />

      <CheckOutModal
        isOpen={isCheckOutOpen}
        onClose={() => setIsCheckOutOpen(false)}
        onSuccess={loadData}
        targetResident={targetResident}
        unitName={targetUnitName}
      />
    </div>
  );
};
