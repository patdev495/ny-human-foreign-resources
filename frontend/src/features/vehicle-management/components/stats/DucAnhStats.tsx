import React, { useEffect, useState } from "react";
import { fetchDispatches } from "../../api";
import type { VehicleDispatch } from "../../types";
import { OdometerLogList } from "../OdometerLogList";
import { QuickOdometerModal } from "../dispatch/QuickOdometerModal";
import { analyzeDailyDispatches } from "../../utils/odometerUtils";

export const DucAnhStats: React.FC = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState<string>(firstDayOfMonth);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showUnclosedList, setShowUnclosedList] = useState<boolean>(false);
  const [filterOnlyUnclosed, setFilterOnlyUnclosed] = useState<boolean>(false);

  const [quickOdoDispatch, setQuickOdoDispatch] = useState<VehicleDispatch | null>(null);
  const [isQuickOdoOpen, setIsQuickOdoOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);


  const loadDispatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDispatches({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        ownershipGroup: "COMPANY_OWNED",
      });
      setDispatches(data);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải danh sách chuyến đi Xe Đức Anh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDispatches(); }, [fromDate, toDate]);

  const odoAnalysis = analyzeDailyDispatches(dispatches);

  const totalTripKm = dispatches.reduce((sum, d) => {
    if (d.start_km !== undefined && d.start_km !== null && d.end_km !== undefined && d.end_km !== null && d.end_km >= d.start_km) {
      return sum + (d.end_km - d.start_km);
    }
    return sum;
  }, 0);

  const unclosedDispatches = dispatches.filter((d) => {
    const info = odoAnalysis.get(d.id);
    return info && (info.isMissingRequiredOdo || info.isMissingRequiredTime);
  });

  const displayedDispatches = filterOnlyUnclosed ? unclosedDispatches : dispatches;



  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🏢</span> Thống Kê & Bảng Kê Điều Xe — Xe Công Ty (Đức Anh)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp chuyến điều xe lẻ, cảnh báo thiếu KM / Giờ về chuyến cuối để tính tăng ca hợp đồng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-sky-50/80 p-2.5 rounded-xl border border-sky-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-900">Từ ngày:</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2.5 py-1 text-xs font-semibold border border-sky-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-900">Đến ngày:</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2.5 py-1 text-xs font-semibold border border-sky-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-1 border-l border-sky-300 pl-2">
              <button type="button" onClick={() => { setFromDate(firstDayOfMonth); setToDate(todayStr); }} className="px-2 py-1 text-[11px] font-bold bg-sky-200/80 hover:bg-sky-300 text-sky-900 rounded-md cursor-pointer">Tháng này</button>
              <button type="button" onClick={() => { setFromDate(""); setToDate(""); }} className="px-2 py-1 text-[11px] font-bold bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-md cursor-pointer">Tất cả</button>
            </div>
          </div>
        </div>
      </div>


      {/* Smart Interactive Warning Banner */}
      {unclosedDispatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Cảnh báo: Phát hiện {unclosedDispatches.length} chuyến xe chưa chốt KM đồng hồ hoặc thiếu Giờ đón / Giờ về
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Bấm nút bên dưới để xem danh sách chi tiết các chuyến thiếu của từng xe & từng ngày và chốt ngay.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setShowUnclosedList(!showUnclosedList)} className="px-3 py-1.5 bg-amber-200/90 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg cursor-pointer">
                {showUnclosedList ? "▲ Thu gọn danh sách" : `🔍 Xem ${unclosedDispatches.length} chuyến thiếu`}
              </button>
              <button type="button" onClick={() => setFilterOnlyUnclosed(!filterOnlyUnclosed)} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer border ${filterOnlyUnclosed ? "bg-rose-600 text-white border-rose-700 hover:bg-rose-700" : "bg-amber-600 text-white border-amber-700 hover:bg-amber-700"}`}>
                {filterOnlyUnclosed ? "❌ Bỏ lọc (Hiện tất cả)" : "⚠️ Chỉ lọc chuyến thiếu"}
              </button>
            </div>
          </div>

          {/* Expandable Missing Trips List */}
          {showUnclosedList && (
            <div className="border-t border-amber-300/80 pt-3 space-y-2 max-h-72 overflow-y-auto">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                Danh sách chi tiết các chuyến cần bổ sung thông tin:
              </div>
              {unclosedDispatches.map((d) => {
                const info = odoAnalysis.get(d.id);
                return (
                  <div key={d.id} className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded font-mono border border-amber-200">📅 {d.dispatch_date}</span>
                      <span className="font-bold text-blue-900">🏢 {d.vehicle_name}</span>
                      <span className="text-slate-500 font-medium">({d.pickup_location || "—"} ➔ {d.dropoff_location || "—"})</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {info?.warningMessage}
                      </span>
                      <button type="button" onClick={() => { setQuickOdoDispatch(d); setIsQuickOdoOpen(true); }} className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs cursor-pointer">
                        📟 Chốt KM & Giờ Về
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Số chuyến điều xe Đức Anh</span>
            <span className="text-2xl font-bold text-slate-900">{dispatches.length} chuyến</span>
          </div>
          <span className="text-2xl">🚐</span>
        </div>
        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-sky-700 font-medium block">Tổng KM chạy theo đồng hồ</span>
            <span className="text-2xl font-extrabold text-sky-900">{totalTripKm.toFixed(1)} KM</span>
          </div>
          <span className="text-2xl">📟</span>
        </div>
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-medium block">Hình thức hợp đồng</span>
            <span className="text-base font-bold text-emerald-900">Thuê khoán trọn gói tháng</span>
          </div>
          <span className="text-2xl">📑</span>
        </div>
      </div>

      {/* Dispatch Trips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            📅 Danh sách các chuyến điều xe Đức Anh {filterOnlyUnclosed ? "(Đang lọc: Chỉ chuyến thiếu)" : fromDate || toDate ? `(Từ ${fromDate || "..."} Đến ${toDate || "..."})` : "(Tất cả)"}
          </span>
          <span className="text-xs font-medium text-slate-500">
            Hiển thị: <strong className="text-slate-900">{displayedDispatches.length} / {dispatches.length}</strong> chuyến
          </span>
        </div>

        {loading && <div className="p-8 text-center text-xs text-slate-500">Đang tải...</div>}
        {error && <div className="p-8 text-center text-xs text-rose-500">{error}</div>}

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
                  <th className="p-3">Chỉ số KM & Giờ Làm Việc</th>
                  <th className="p-3 text-right">Chi phí chuyến</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {filterOnlyUnclosed ? "🎉 Tuyệt vời! Không có chuyến xe nào bị thiếu thông tin." : "Không có chuyến xe nào."}
                    </td>
                  </tr>
                ) : (
                  displayedDispatches.map((d, index) => {
                    const odoVal = d.odometer_km ?? d.start_km ?? d.end_km;
                    const hasOdo = odoVal !== undefined && odoVal !== null;
                    const odoInfo = odoAnalysis.get(d.id);

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-medium text-slate-400">{index + 1}</td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{d.dispatch_date}</div>
                          <div className="text-[11px] font-mono flex flex-col gap-0.5 mt-0.5">
                            <span className="text-slate-600">🕒 Đón: <strong>{d.pickup_time || "—"}</strong></span>
                            {d.return_time ? (
                              <span className="text-blue-700 font-bold">🕒 Về: {d.return_time}</span>
                            ) : odoInfo?.isLastOfDay ? (
                              <span className="text-amber-800 font-bold bg-amber-100 px-1 py-0.2 rounded border border-amber-300 text-[10px] w-fit">⚠️ Thiếu Giờ về</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-blue-900 flex items-center gap-1">🏢 {d.vehicle_name}</div>
                          {d.driver_name && (
                            <div className="text-[11px] text-slate-500">
                              TX: {d.driver_name} {d.license_plate ? `(${d.license_plate})` : ""}
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
                        <td className="p-3 font-mono">
                          {odoInfo?.warningMessage && (
                            <div className="mb-1">
                              <span className="text-[10px] text-amber-900 font-sans font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-block">
                                {odoInfo.warningMessage}
                              </span>
                            </div>
                          )}
                          {hasOdo ? (
                            <div className="text-sky-700 font-bold text-[11px]">
                              📟 {odoInfo?.isFirstOfDay && odoInfo?.isLastOfDay ? "Đồng hồ Đầu & Cuối: " : odoInfo?.isFirstOfDay ? "Đồng hồ Đầu ngày: " : odoInfo?.isLastOfDay ? "Đồng hồ Cuối ngày: " : "Đồng hồ: "}
                              {odoVal?.toLocaleString("vi-VN")} KM
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-sans font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                              ⚠️ Chưa chốt KM
                            </span>
                          )}
                          {(odoInfo?.isMissingRequiredOdo || odoInfo?.isMissingRequiredTime || !hasOdo) && (
                            <button type="button" onClick={() => { setQuickOdoDispatch(d); setIsQuickOdoOpen(true); }} className="mt-1 px-2 py-0.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-2xs cursor-pointer block">
                              📟 Chốt KM & Giờ Về
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-500">
                          0 đ <span className="text-[10px] text-slate-400 block font-normal">(Khoán tháng)</span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[180px] truncate">{d.notes || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Odometer Daily Log List Section */}
      <div className="border-t border-slate-200 pt-4">
        <OdometerLogList refreshTrigger={refreshKey} />
      </div>

      <QuickOdometerModal isOpen={isQuickOdoOpen} dispatch={quickOdoDispatch} onClose={() => setIsQuickOdoOpen(false)} onSuccess={loadDispatches} />
    </div>

  );
};
