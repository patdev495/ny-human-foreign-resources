import React, { useEffect, useState } from "react";
import {
  fetchDailyJanitorAttendance,
  resetJanitorAttendance,
  saveJanitorAbsence,
  type JanitorDailyAttendanceSheet,
} from "../api/janitorApi";
import { fetchEmployees } from "../api";
import type { ForeignEmployee } from "../types";
import { JanitorRangeAbsenceModal } from "./janitorial/JanitorRangeAbsenceModal";

export const JanitorDailyAttendance: React.FC = () => {
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sheet, setSheet] = useState<JanitorDailyAttendanceSheet | null>(null);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [sheetData, allEmps] = await Promise.all([
        fetchDailyJanitorAttendance(targetDate),
        fetchEmployees(),
      ]);
      setSheet(sheetData);
      setEmployees(
        allEmps.filter(
          (e) =>
            e.employee_type === "JANITORIAL" ||
            (e.role && e.role.toLowerCase().includes("tạp vụ"))
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi tải dữ liệu điểm danh tạp vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetDate]);

  const handleStatusChange = async (
    employeeId: number,
    newType: "PRESENT" | "FULL_DAY" | "HALF_DAY",
    reason: string = ""
  ) => {
    try {
      if (newType === "PRESENT") {
        await resetJanitorAttendance(employeeId, targetDate);
      } else {
        await saveJanitorAbsence({
          employee_id: employeeId,
          attendance_date: targetDate,
          absence_type: newType,
          reason: reason.trim() || undefined,
        });
      }
      loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi lưu trạng thái điểm danh");
    }
  };

  const handleDateShift = (days: number) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split("T")[0]);
  };

  const [locationFilter, setLocationFilter] = useState("ALL");

  const filteredItems = (sheet?.items || []).filter((item) => {
    if (
      searchQuery &&
      !item.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(item.employee_code && item.employee_code.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    if (locationFilter !== "ALL" && (item.workplace_location || "DORMITORY") !== locationFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            📅
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Điểm danh Tạp vụ Hàng ngày
            </h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">
              Mặc định tất cả Tạp vụ đi làm đủ. Tích chọn các trường hợp vắng/nghỉ và nhập lý do.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsRangeModalOpen(true)}
            className="px-4 py-2.5 bg-white text-sky-800 font-extrabold text-xs rounded-xl shadow-xs hover:bg-sky-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>🗓️</span>
            <span>Đăng ký nghỉ theo đợt</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Date selector & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleDateShift(-1)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ◀ Ngày trước
          </button>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            onClick={() => handleDateShift(1)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Ngày sau ▶
          </button>
          <button
            onClick={() => setTargetDate(new Date().toISOString().split("T")[0])}
            className="px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Lọc nơi làm việc:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Tất cả vị trí</option>
              <option value="DORMITORY">🏫 KTX (Ký túc xá)</option>
              <option value="CN09">🏭 Nhà máy CN09</option>
              <option value="CN15">🏭 Nhà máy CN15</option>
              <option value="COMPANY">🏢 Văn phòng Công ty</option>
            </select>
          </div>

          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, mã nhân viên..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-bold uppercase">Tổng Tạp vụ</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {sheet?.total_count || 0}
          </div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-emerald-600 text-xs font-bold uppercase">Đi làm (1.0 công)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {sheet?.present_count || 0}
          </div>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-2xs">
          <div className="text-rose-600 text-xs font-bold uppercase">Nghỉ cả ngày (X)</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {sheet?.full_day_absence_count || 0}
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="text-amber-600 text-xs font-bold uppercase">Nghỉ nửa ngày (0.5)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {sheet?.half_day_absence_count || 0}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold">
            Đang tải dữ liệu điểm danh...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold">
            Không tìm thấy nhân viên tạp vụ nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="px-4 py-3 w-12 text-center">STT</th>
                  <th className="px-4 py-3">Mã NV</th>
                  <th className="px-4 py-3">Họ và Tên</th>
                  <th className="px-4 py-3">Nơi làm việc</th>
                  <th className="px-4 py-3">Trạng thái điểm danh</th>
                  <th className="px-4 py-3">Lý do nghỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isPresent = item.status === "PRESENT";
                  const isFull = item.absence_type === "FULL_DAY";
                  const isHalf = item.absence_type === "HALF_DAY";

                  return (
                    <tr key={item.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {item.employee_code || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {item.name_latin}
                        {item.name_chinese && (
                          <span className="text-slate-400 font-normal ml-1">
                            ({item.name_chinese})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            item.workplace_location === "DORMITORY"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : item.workplace_location === "CN09"
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : item.workplace_location === "CN15"
                              ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {item.workplace_location === "DORMITORY"
                            ? "🏫 KTX"
                            : item.workplace_location === "CN09"
                            ? "🏭 CN09"
                            : item.workplace_location === "CN15"
                            ? "🏭 CN15"
                            : "🏢 Công ty"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.employee_id, "PRESENT")}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ✓ Đi làm
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.employee_id,
                                "FULL_DAY",
                                item.reason || ""
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isFull
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ✕ Nghỉ 1 ngày
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.employee_id,
                                "HALF_DAY",
                                item.reason || ""
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isHalf
                                ? "bg-amber-500 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ½ Nghỉ 0.5 ngày
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {!isPresent ? (
                          <input
                            type="text"
                            defaultValue={item.reason || ""}
                            onBlur={(e) =>
                              handleStatusChange(
                                item.employee_id,
                                (item.absence_type as any) || "FULL_DAY",
                                e.target.value
                              )
                            }
                            placeholder="Nhập lý do vắng..."
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <JanitorRangeAbsenceModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        employees={employees}
        onSuccess={loadData}
      />
    </div>
  );
};
