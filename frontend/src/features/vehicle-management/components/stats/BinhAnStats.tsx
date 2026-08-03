import React, { useEffect, useState } from "react";
import { exportVehicleExcel, fetchDispatches } from "../../api";
import type { VehicleDispatch } from "../../types";

export const BinhAnStats: React.FC = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState<string>(firstDayOfMonth);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportVehicleExcel("OUTSOURCED", fromDate, toDate);
    } catch (err: any) {
      alert("Lỗi khi xuất Excel Bình An: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDispatches({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        ownershipGroup: "OUTSOURCED",
      });
      setDispatches(data);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu thống kê Nhà xe Bình An");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  const handleSelectThisMonth = () => {
    setFromDate(firstDayOfMonth);
    setToDate(todayStr);
  };

  const handleSelectAllTime = () => {
    setFromDate("");
    setToDate("");
  };

  const totalCost = dispatches.reduce((sum, d) => sum + (d.cost || 0), 0);
  const fourSeatCount = dispatches.filter((d) => (d.vehicle_name || "").includes("4 chỗ")).length;
  const sevenSeatCount = dispatches.filter((d) => (d.vehicle_name || "").includes("7 chỗ")).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Date Range Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🚕</span> Bảng Kê Cước Chi Tiết — Nhà Xe Bình An
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp danh sách các chuyến xe thuê ngoài phát sinh theo khoảng thời gian tùy chọn
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-amber-300 pl-2">
            <button
              type="button"
              onClick={handleSelectThisMonth}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-md transition-colors cursor-pointer"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={handleSelectAllTime}
              className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition-colors cursor-pointer"
            >
              Tất cả
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <span>📥</span> {exporting ? "Đang xuất..." : "Xuất Excel Bảng Kê Bình An"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tổng số chuyến đi</span>
            <span className="text-2xl font-bold text-slate-900">{dispatches.length} chuyến</span>
          </div>
          <span className="text-2xl">🚕</span>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-medium block">Tổng cước phí</span>
            <span className="text-2xl font-extrabold text-emerald-900">
              {totalCost.toLocaleString("vi-VN")} đ
            </span>
          </div>
          <span className="text-2xl">💰</span>
        </div>

        <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-700 font-medium block">Chuyến Xe 4 chỗ</span>
            <span className="text-xl font-bold text-blue-900">{fourSeatCount} chuyến</span>
          </div>
          <span className="text-xl">🚗</span>
        </div>

        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-700 font-medium block">Chuyến Xe 7 chỗ</span>
            <span className="text-xl font-bold text-purple-900">{sevenSeatCount} chuyến</span>
          </div>
          <span className="text-xl">🚐</span>
        </div>
      </div>

      {/* Dispatch List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Danh sách chuyến đi Bình An {fromDate || toDate ? `(Từ ${fromDate || "..."} Đến ${toDate || "..."})` : "(Tất cả thời gian)"}
          </span>
          <span className="text-xs font-medium text-slate-500">
            Tổng cộng: <strong className="text-slate-900">{dispatches.length}</strong> chuyến
          </span>
        </div>

        {loading && (
          <div className="p-8 text-center text-xs text-slate-500">Đang tải bảng kê cước Bình An...</div>
        )}
        {error && <div className="p-8 text-center text-xs text-rose-500 font-medium">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3 text-center w-12">STT</th>
                  <th className="p-3">Ngày & Giờ</th>
                  <th className="p-3">Phương tiện / Lái xe</th>
                  <th className="p-3">Hành khách</th>
                  <th className="p-3">Lộ trình (Điểm đi ➔ Đến)</th>
                  <th className="p-3 text-right">Cước phí</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Không tìm thấy chuyến xe nào của Nhà xe Bình An trong khoảng thời gian đã chọn.
                    </td>
                  </tr>
                ) : (
                  dispatches.map((d, index) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{d.dispatch_date}</div>
                        {d.pickup_time && (
                          <div className="text-[11px] text-slate-500 font-mono">🕒 {d.pickup_time}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <span>🚕</span> {d.vehicle_name}
                        </div>
                        {d.driver_name && (
                          <div className="text-[11px] text-slate-500">
                            TX: {d.driver_name} {d.driver_phone ? `(📞 ${d.driver_phone})` : ""}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{d.passenger_name || "—"}</div>
                        <div className="text-[11px] text-slate-500">{d.passenger_count} người</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">
                          <span className="text-emerald-700 font-semibold">{d.pickup_location || "—"}</span>
                          <span className="mx-1 text-slate-400">➔</span>
                          <span className="text-blue-700 font-semibold">{d.dropoff_location || "—"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {d.cost > 0 ? `${d.cost.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </td>
                      <td className="p-3 text-slate-500 max-w-[180px] truncate">{d.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {dispatches.length > 0 && (
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={5} className="p-3.5 text-right text-slate-700 uppercase">
                      TỔNG CỘNG CƯỚC XE BÌNH AN:
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm text-emerald-800 font-extrabold">
                      {totalCost.toLocaleString("vi-VN")} đ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
