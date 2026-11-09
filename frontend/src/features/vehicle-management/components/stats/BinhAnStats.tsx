import { useState } from "react";
import { exportVehicleExcel } from "../../api";
import { systemPrimaryButton } from "../../../../shared/components/systemStyles";
import { useStatsDispatches } from "./useStatsDispatches";
import { StatsDateFilter, StatsLoadState } from "./StatsDateFilter";
import { StatsDispatchTable } from "./StatsDispatchTable";

export function BinhAnStats() {
  const stats = useStatsDispatches("OUTSOURCED");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  async function exportExcel() {
    if (exporting || stats.loading || stats.error) return;
    setExporting(true);
    setExportError(null);
    try { await exportVehicleExcel("OUTSOURCED", stats.fromDate, stats.toDate); }
    catch (failure: unknown) { setExportError(failure instanceof Error ? failure.message : "Không xuất được bảng kê Excel."); }
    finally { setExporting(false); }
  }
  const totalCost = stats.dispatches.reduce((sum, dispatch) => sum + (dispatch.cost || 0), 0);
  const fourSeat = stats.dispatches.filter(dispatch => dispatch.vehicle_name.includes("4 chỗ")).length;
  const sevenSeat = stats.dispatches.filter(dispatch => dispatch.vehicle_name.includes("7 chỗ")).length;
  return <div className="space-y-4">
    <StatsDateFilter {...stats} disabled={exporting}>
      <button type="button" onClick={() => void exportExcel()} disabled={exporting || stats.loading || !!stats.error} className={`${systemPrimaryButton} sm:ml-auto`}>{exporting ? "Đang xuất…" : "Xuất Excel bảng kê"}</button>
    </StatsDateFilter>
    {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
    <StatsLoadState loading={stats.loading} error={stats.error} onRetry={() => void stats.load()} />
    {!stats.loading && !stats.error && <>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600"><span>Tổng: {stats.dispatches.length} chuyến</span><span>Cước: <strong className="font-semibold text-slate-900">{totalCost.toLocaleString("vi-VN")} đ</strong></span><span>Xe 4 chỗ: {fourSeat}</span><span>Xe 7 chỗ: {sevenSeat}</span></p>
      <StatsDispatchTable dispatches={stats.dispatches} />
    </>}
  </div>;
}
