import { useState } from "react";
import type { VehicleDispatch } from "../../types";
import { OdometerLogList } from "../OdometerLogList";
import { QuickOdometerModal } from "../dispatch/QuickOdometerModal";
import { analyzeDailyDispatches } from "../../utils/odometerUtils";
import { SystemTabs } from "../../../../shared/components/SystemTabs";
import { useStatsDispatches } from "./useStatsDispatches";
import { StatsDateFilter, StatsLoadState } from "./StatsDateFilter";
import { StatsDispatchTable } from "./StatsDispatchTable";

export function DucAnhStats() {
  const stats = useStatsDispatches("COMPANY_OWNED");
  const [filter, setFilter] = useState<"ALL" | "UNCLOSED">("ALL");
  const [quickDispatch, setQuickDispatch] = useState<VehicleDispatch | null>(null);
  const analysis = analyzeDailyDispatches(stats.dispatches);
  const unclosed = stats.dispatches.filter(dispatch => {
    const info = analysis.get(dispatch.id);
    return info?.isMissingRequiredOdo || info?.isMissingRequiredTime;
  });
  return <div className="space-y-4">
    <StatsDateFilter {...stats} />
    <StatsLoadState loading={stats.loading} error={stats.error} onRetry={() => void stats.load()} />
    {!stats.loading && !stats.error && <>
      <p className="text-sm text-slate-600">{stats.dispatches.length} chuyến xe công ty · Hợp đồng khoán tháng. Quãng đường và giờ làm việc được tổng hợp theo từng xe, từng ngày ở bảng dưới.</p>
      <SystemTabs<"ALL" | "UNCLOSED"> label="Trạng thái chốt chuyến xe công ty" active={filter} onChange={setFilter} items={[
        { key: "ALL", label: "Tất cả chuyến", count: stats.dispatches.length }, { key: "UNCLOSED", label: "Thiếu đồng hồ / giờ", count: unclosed.length },
      ]} />
      {unclosed.length > 0 && <p className="text-sm text-amber-800">{unclosed.length} chuyến thiếu đồng hồ hoặc giờ đón / giờ về. Chọn bộ lọc để xem và bổ sung ngay tại dòng chuyến xe.</p>}
      <StatsDispatchTable dispatches={filter === "UNCLOSED" ? unclosed : stats.dispatches} analysis={analysis} onQuickOdo={setQuickDispatch} />
    </>}
    <div hidden={stats.loading || !!stats.error}>
      <OdometerLogList fromDate={stats.fromDate} toDate={stats.toDate} dispatches={stats.dispatches} />
    </div>
    <QuickOdometerModal isOpen={quickDispatch !== null} dispatch={quickDispatch} onClose={() => setQuickDispatch(null)} onSuccess={() => void stats.load()} />
  </div>;
}
