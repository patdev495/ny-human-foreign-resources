import { useEffect, useState } from "react";
import { fetchOdometerLogs, fetchVehicles } from "../api";
import type { DailyOdometerLog, Vehicle, VehicleDispatch } from "../types";
import { summarizeVehicleDays } from "../utils/dailyVehicleSummary";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";
import { StatsLoadState } from "./stats/StatsDateFilter";

interface OdometerLogListProps {
  fromDate: string;
  toDate: string;
  dispatches: VehicleDispatch[];
}

export function OdometerLogList({ fromDate, toDate, dispatches }: OdometerLogListProps) {
  const [logs, setLogs] = useState<DailyOdometerLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchVehicles("COMPANY_OWNED"), fetchOdometerLogs({ fromDate: fromDate || undefined, toDate: toDate || undefined })])
      .then(([vehicleData, logData]) => { if (active) { setVehicles(vehicleData); setLogs(logData); } })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "Không tải được tổng hợp quãng đường."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fromDate, toDate, retry]);

  const summaries = summarizeVehicleDays(dispatches, logs, vehicles).filter(summary => selectedVehicle === "ALL" || summary.vehicle_id === Number(selectedVehicle));
  const totalKm = summaries.reduce((sum, summary) => sum + (summary.daily_km ?? 0), 0);
  const overtime = summaries.reduce((sum, summary) => sum + (summary.overtime_hours ?? 0), 0);
  const completed = summaries.filter(summary => summary.daily_km !== undefined).length;
  const average = completed > 0 ? Math.round(totalKm / completed) : undefined;
  return <section className="space-y-4 border-t border-slate-200 pt-5" aria-labelledby="daily-vehicle-summary-title">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 id="daily-vehicle-summary-title" className="text-base font-semibold text-slate-900">Tổng hợp quãng đường và giờ làm việc theo ngày</h2>
        <p className="mt-1 text-sm text-slate-500">Dùng khoảng ngày đã chọn ở trên. Tổng km lấy từ đồng hồ đầu / cuối ngày của từng xe.</p></div>
      <label className="w-full text-sm text-slate-700 sm:w-auto"><span className="mb-1 block">Phương tiện</span>
        <select value={selectedVehicle} onChange={event => setSelectedVehicle(event.target.value)} className={systemField}>
          <option value="ALL">Tất cả xe công ty</option>
          {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.license_plate || "Chưa có biển số"})</option>)}
        </select>
      </label>
    </div>
    <StatsLoadState loading={loading} error={error} onRetry={() => setRetry(value => value + 1)} />
    {!loading && !error && <>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600"><span>Quãng đường đã đủ số liệu: <strong className="font-semibold text-slate-900">{totalKm.toLocaleString("vi-VN")} km</strong></span>
        <span>Tăng ca đã ghi nhận: {overtime.toFixed(1)} giờ</span><span>Đủ đồng hồ: {completed} / {summaries.length} lượt xe/ngày</span>
        <span>Trung bình: {average !== undefined ? `${average.toLocaleString("vi-VN")} km/xe/ngày` : "—"}</span></p>
      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div role="region" aria-label="Bảng tổng hợp quãng đường theo ngày" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>{["STT", "Ngày", "Phương tiện", "Giờ đón → về", "Đồng hồ đầu → cuối (km)", "Quãng đường (km)", "Tăng ca (giờ)", "Trạng thái", "Ghi chú"].map((title, index) => <th key={title} scope="col" className={`px-4 py-3 font-medium ${index === 5 || index === 6 ? "text-right" : ""}`}>{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {summaries.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Không có dữ liệu quãng đường phù hợp.</td></tr>}
              {summaries.map((summary, index) => {
                const warnings = [
                  ...(summary.start_km === undefined ? ["Thiếu km đầu"] : []),
                  ...(summary.end_km === undefined ? ["Thiếu km cuối"] : []),
                  ...(summary.start_km !== undefined && summary.end_km !== undefined && summary.end_km < summary.start_km ? ["Km cuối nhỏ hơn km đầu"] : []),
                  ...(!summary.pickup_time ? ["Chưa có giờ đón"] : []), ...(!summary.return_time ? ["Chưa có giờ về"] : []),
                ];
                return <tr key={summary.key} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-3">{summary.date.split("-").reverse().join("/")}</td>
                  <td className="min-w-48 px-4 py-3"><div className="font-medium text-slate-900">{summary.vehicle_name}</div><div className="mt-1 text-slate-500">{summary.license_plate || "—"}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{summary.pickup_time || "—"} → {summary.return_time || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{summary.start_km?.toLocaleString("vi-VN") ?? "—"} → {summary.end_km?.toLocaleString("vi-VN") ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{summary.daily_km?.toLocaleString("vi-VN") ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{summary.overtime_hours?.toFixed(1) ?? "—"}</td>
                  <td className="min-w-44 px-4 py-3">{warnings.length > 0 ? <div className="space-y-1 text-amber-800">{warnings.map(warning => <p key={warning}>{warning}</p>)}</div> : "Đủ số liệu"}</td>
                  <td className="max-w-60 whitespace-pre-wrap break-words px-4 py-3 text-slate-500">{summary.notes || "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2 text-sm text-slate-500"><span>{summaries.length} lượt xe/ngày</span><button type="button" onClick={() => setRetry(value => value + 1)} className={systemSecondaryButton}>Làm mới tổng hợp</button></div>
      </div>
    </>}
  </section>;
}
