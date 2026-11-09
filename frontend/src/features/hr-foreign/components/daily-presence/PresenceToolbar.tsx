import type { DailyPresenceSummary } from "../../types";
import { SystemTabs } from "../../../../shared/components/SystemTabs";
import { systemField, systemTextButton } from "../../../../shared/components/systemStyles";

export type PresenceScope = "IN_VN" | "EXITED";
export type PresenceAccommodation = "ALL" | "KTX" | "HOTEL" | "UNASSIGNED";
export type PresenceView = "GROUPED" | "LIST";

interface Props {
  summary: DailyPresenceSummary | null;
  scope: PresenceScope;
  onScope: (value: PresenceScope) => void;
  accommodation: PresenceAccommodation;
  onAccommodation: (value: PresenceAccommodation) => void;
  view: PresenceView;
  onView: (value: PresenceView) => void;
  query: string;
  onQuery: (value: string) => void;
}

export function PresenceToolbar({ summary, scope, onScope, accommodation, onAccommodation, view, onView, query, onQuery }: Props) {
  return <>
    <SystemTabs label="Lọc theo hiện diện" active={scope} onChange={onScope} items={[
      { key: "IN_VN", label: "Đang ở Việt Nam", count: summary?.total_in_vn },
      { key: "EXITED", label: "Đang ở nước ngoài", count: summary ? summary.exited_count ?? 0 : undefined },
    ]} />
    <section className="rounded-sm border border-slate-200 bg-white" aria-label="Tìm kiếm và lọc hiện diện">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="presence-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
          <input id="presence-search" type="search" value={query} onChange={(event) => onQuery(event.target.value)}
            placeholder="Tên, mã nhân sự, bộ phận, phòng, khách sạn…" className={systemField} />
        </div>
        {scope === "IN_VN" && <div className="w-full sm:w-44">
          <label htmlFor="presence-view" className="mb-1.5 block text-sm text-slate-600">Cách hiển thị</label>
          <select id="presence-view" value={view} onChange={(event) => onView(event.target.value as PresenceView)} className={systemField}>
            <option value="LIST">Bảng nhân sự</option><option value="GROUPED">Theo chỗ ở</option>
          </select>
        </div>}
        {(query || (scope === "IN_VN" && accommodation !== "ALL")) && <button type="button" onClick={() => { onQuery(""); onAccommodation("ALL"); }} className={systemTextButton}>Xóa bộ lọc</button>}
      </div>
      {scope === "IN_VN" ? <div className="border-t border-slate-200 px-4">
        <SystemTabs label="Lọc theo chỗ ở" active={accommodation} onChange={onAccommodation} items={[
          { key: "ALL", label: "Tất cả", count: summary?.total_in_vn },
          { key: "KTX", label: "KTX", count: summary?.ktx_count },
          { key: "HOTEL", label: "Khách sạn", count: summary?.hotel_count },
          { key: "UNASSIGNED", label: "Chưa xếp chỗ", count: summary ? summary.unassigned_count ?? 0 : undefined },
        ]} />
      </div> : <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Nhân sự đã về nước hoặc chưa sang Việt Nam tại ngày tra cứu.</p>}
    </section>
  </>;
}
