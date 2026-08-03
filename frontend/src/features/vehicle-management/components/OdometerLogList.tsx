import React, { useEffect, useState } from "react";
import { fetchDispatches, fetchOdometerLogs, fetchVehicles } from "../api";
import type { Vehicle, VehicleDispatch } from "../types";
import { calculateOvertime } from "../utils/odometerUtils";

interface DailyVehicleSummary {
  date: string;
  vehicle_id: number;
  vehicle_name: string;
  license_plate?: string;
  start_km?: number;
  end_km?: number;
  daily_km: number;
  has_start: boolean;
  has_end: boolean;
  pickup_time?: string;
  return_time?: string;
  overtime_hours: number;
  notes?: string;
}

interface OdometerLogListProps {
  refreshTrigger?: number;
}

export const OdometerLogList: React.FC<OdometerLogListProps> = ({ refreshTrigger }) => {
  const [summaries, setSummaries] = useState<DailyVehicleSummary[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>(firstDayOfMonth);
  const [toDate, setToDate] = useState<string>(todayStr);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const vehicleList = await fetchVehicles("COMPANY_OWNED");
      const ducAnhVehicles = vehicleList.filter(
        (v) => v.license_plate && (v.license_plate.includes("98A") || v.license_plate.includes("99H"))
      );
      setVehicles(ducAnhVehicles.length > 0 ? ducAnhVehicles : vehicleList);

      const dispatches = await fetchDispatches({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        ownershipGroup: "COMPANY_OWNED",
      });

      const logList = await fetchOdometerLogs({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      const groups = new Map<string, VehicleDispatch[]>();
      for (const d of dispatches) {
        if (selectedVehicleId !== "ALL" && d.vehicle_id !== Number(selectedVehicleId)) continue;
        const vehicleKey = d.vehicle_id ? `v_${d.vehicle_id}` : d.vehicle_name;
        const key = `${d.dispatch_date}_${vehicleKey}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      }

      const summaryMap = new Map<string, DailyVehicleSummary>();

      for (const [key, list] of groups.entries()) {
        const sorted = [...list].sort((a, b) => {
          const timeA = a.pickup_time || "00:00";
          const timeB = b.pickup_time || "00:00";
          if (timeA !== timeB) return timeA.localeCompare(timeB);
          return a.id - b.id;
        });

        const firstTrip = sorted[0];
        const lastTrip = sorted[sorted.length - 1];

        const startKm = firstTrip.odometer_km ?? firstTrip.start_km ?? undefined;
        const endKm = lastTrip.end_km ?? lastTrip.odometer_km ?? (sorted.length === 1 ? startKm : undefined);
        const hasStart = startKm !== undefined && startKm !== null;
        const hasEnd = endKm !== undefined && endKm !== null;

        const pickupTime = firstTrip.pickup_time || undefined;
        const returnTime = lastTrip.return_time || lastTrip.pickup_time || undefined;

        let dailyKm = 0;
        if (hasStart && hasEnd && (endKm as number) >= (startKm as number)) {
          dailyKm = (endKm as number) - (startKm as number);
        }

        const otHours = calculateOvertime(firstTrip.dispatch_date, pickupTime, returnTime);

        summaryMap.set(key, {
          date: firstTrip.dispatch_date,
          vehicle_id: firstTrip.vehicle_id || 0,
          vehicle_name: firstTrip.vehicle_name,
          license_plate: firstTrip.license_plate || undefined,
          start_km: startKm ?? undefined,
          end_km: endKm ?? undefined,
          daily_km: dailyKm,
          has_start: hasStart,
          has_end: hasEnd,
          pickup_time: pickupTime,
          return_time: returnTime,
          overtime_hours: otHours,
        });
      }

      for (const log of logList) {
        if (selectedVehicleId !== "ALL" && log.vehicle_id !== Number(selectedVehicleId)) continue;
        const key = `${log.log_date}_${log.vehicle_name}`;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            date: log.log_date,
            vehicle_id: log.vehicle_id,
            vehicle_name: log.vehicle_name || `Xe #${log.vehicle_id}`,
            license_plate: log.license_plate || undefined,
            start_km: log.start_km > 0 ? log.start_km : undefined,
            end_km: log.end_km > 0 ? log.end_km : undefined,
            daily_km: log.daily_km || 0,
            has_start: log.start_km > 0,
            has_end: log.end_km > 0,
            overtime_hours: 0,
            notes: log.notes || undefined,
          });
        }
      }

      setSummaries(Array.from(summaryMap.values()).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu thống kê KM Odometer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVehicleId, fromDate, toDate, refreshTrigger]);

  const totalKmPeriod = summaries.reduce((sum, s) => sum + s.daily_km, 0);
  const totalOtHours = summaries.reduce((sum, s) => sum + s.overtime_hours, 0);
  const completedDaysCount = summaries.filter((s) => s.has_start && s.has_end).length;
  const avgKmDay = completedDaysCount > 0 ? Math.round(totalKmPeriod / completedDaysCount) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📊</span> Bảng Tổng Hợp Quãng Đường & Giờ Làm Việc Theo Ngày (Tự Động)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tự động tính tổng KM và giờ tăng ca từ <strong>Giờ đón chuyến đầu</strong> và <strong>Giờ kết thúc chuyến cuối</strong> cho xe Đức Anh
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Tổng KM Chạy Trong Kỳ</span>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">
              {totalKmPeriod.toLocaleString("vi-VN")} <span className="text-sm font-normal">km</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">Km</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Tổng Giờ Tăng Ca</span>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">
              {totalOtHours.toFixed(1)} <span className="text-sm font-normal">giờ</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">🕒</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Số Ngày Đủ Số Liệu</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">
              {completedDaysCount} <span className="text-sm font-normal">ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">#</div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Trung Bình / Ngày</span>
            <div className="text-2xl font-extrabold text-purple-900 mt-1">
              {avgKmDay.toLocaleString("vi-VN")} <span className="text-sm font-normal">km/ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">~</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Chọn Xe</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="border border-slate-300 rounded-lg text-xs px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">-- Tất cả xe công ty --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.license_plate || "Chưa có biển"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded-lg text-xs px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded-lg text-xs px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 self-end pb-0.5">
            <button
              type="button"
              onClick={() => { setFromDate(firstDayOfMonth); setToDate(todayStr); }}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">Đang tự động tổng hợp quãng đường...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 font-medium">{error}</div>
        ) : summaries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Chưa có dữ liệu chuyến đi nào của xe Đức Anh trong khoảng thời gian đã chọn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Ngày ghi nhận</th>
                  <th className="py-3 px-4">Phương tiện / Biển số</th>
                  <th className="py-3 px-4">Giờ Làm Việc (Đón ➔ Về)</th>
                  <th className="py-3 px-4 text-right">KM Đồng Hồ (Đầu ➔ Cuối)</th>
                  <th className="py-3 px-4 text-right">Tổng KM Ngày</th>
                  <th className="py-3 px-4 text-right">Tăng Ca (Overtime)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((s, index) => {
                  const isComplete = s.has_start && s.has_end;
                  return (
                    <tr key={`${s.date}_${s.vehicle_name}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="font-bold text-blue-900">{s.vehicle_name}</div>
                        {s.license_plate && <div className="text-[11px] text-slate-500">{s.license_plate}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-700 font-bold">{s.pickup_time || "—"}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-blue-700 font-bold">{s.return_time || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                        {s.start_km !== undefined ? s.start_km.toLocaleString("vi-VN") : "—"} ➔{" "}
                        {s.end_km !== undefined ? s.end_km.toLocaleString("vi-VN") : "—"} KM
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700 text-sm">
                        {isComplete ? `${s.daily_km.toLocaleString("vi-VN")} KM` : "0 KM"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                        {s.overtime_hours > 0 ? (
                          <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            +{s.overtime_hours.toFixed(1)} giờ
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 giờ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 Đủ số liệu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            ⚠️ {!s.has_start ? "Thiếu KM đầu" : "Thiếu KM cuối"}
                          </span>
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
    </div>
  );
};
