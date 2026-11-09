import { useEffect, useRef, useState } from "react";
import { fetchEndShiftDemand, type DemandView } from "../endShiftApi";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemField, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";
import { dispatchToday } from "./dispatch/dispatchForm";
import { EndShiftOverview } from "./end-shift/EndShiftOverview";
import { EndShiftPeople } from "./end-shift/EndShiftPeople";
import { demandPeople, demandTotals, groupLabels, type GroupFilter } from "./end-shift/endShiftView";

export function EndShiftDemand() {
  const [date, setDate] = useState(dispatchToday);
  const [demand, setDemand] = useState<DemandView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [search, setSearch] = useState("");
  const overviewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchEndShiftDemand(date).then(result => { if (active) { setDemand(result); setUpdatedAt(new Date()); } })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "Không thể tải khai báo tan làm."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, retry]);

  const current = !loading && !error && demand?.date === date ? demand : null;
  const groups = current?.groups || [];
  const totals = demandTotals(groups);
  const people = demandPeople(groups, groupFilter, search);
  const filterLabel = groupFilter === "ALL" ? "Tất cả nhân sự" : groupFilter === "NEEDS_CAR" ? "Nhân sự cần xe về KTX" : groupLabels[groupFilter];

  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end gap-2 rounded-sm border border-slate-200 bg-white p-3 sm:gap-3 sm:p-4">
      <label className="min-w-0 w-full text-sm text-slate-700 sm:w-auto"><span className="mb-1 block">Ngày làm việc</span>
        <input type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} className={`${systemField} min-w-0`} />
      </label>
      <button type="button" onClick={() => setDate(dispatchToday())} className={`${systemSecondaryButton} flex-1 sm:flex-none`}>Hôm nay</button>
      <button type="button" disabled={loading} onClick={() => setRetry(value => value + 1)} className={`${systemSecondaryButton} flex-1 sm:flex-none`}>Làm mới</button>
      {current && updatedAt && <p role="status" className="w-full text-xs text-slate-500">Cập nhật lúc {updatedAt.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>}
    </div>
    {loading && <p role="status" className="py-6 text-sm text-slate-500">Đang tải khai báo tan làm…</p>}
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span>
      <button type="button" onClick={() => setRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button>
    </div>}
    {current && <>
      <div ref={overviewRef} className="scroll-mt-4">
        <EndShiftOverview groups={groups} active={groupFilter} onChange={filter => { setGroupFilter(filter); listRef.current?.scrollIntoView({ block: "start" }); }} />
      </div>
      <div className="hidden space-y-3 lg:block">
        <p className="text-sm text-slate-600"><strong className="font-semibold text-slate-900">{totals.car} người cần xe</strong> · {totals.self} tự di chuyển · {totals.missing} chưa báo. Chưa báo không tính vào nhu cầu xe.</p>
        <SystemTabs<GroupFilter> label="Nhóm nhu cầu xe tan làm" active={groupFilter} onChange={setGroupFilter}
          items={[{ key: "ALL", label: "Tất cả", count: totals.total }, { key: "NEEDS_CAR", label: "Cần xe", count: totals.car }, ...groups.map(group => ({ key: group.key, label: groupLabels[group.key], count: group.count }))]} />
      </div>
      <div ref={listRef} className="scroll-mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3"><h2 className="text-base font-semibold text-slate-900">{filterLabel}</h2><button type="button" onClick={() => overviewRef.current?.scrollIntoView({ block: "start" })} className={`${systemTextButton} lg:hidden`}>Xem thống kê</button></div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-sm text-slate-700"><span className="mb-1 block">Tìm nhân sự</span>
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tên hoặc phòng KTX…" className={systemField} />
          </label>
          {(groupFilter !== "ALL" || search) && <button type="button" onClick={() => { setGroupFilter("ALL"); setSearch(""); }} className={systemSecondaryButton}>Bỏ lọc</button>}
        </div>
        <EndShiftPeople people={people} total={totals.total} date={date} />
      </div>
      <p className="text-sm text-slate-500">Giờ hiển thị là giờ tan làm. HR sắp xếp xe về KTX dựa trên khai báo của nhân viên.</p>
    </>}
  </section>;
}
