import type { RoomOccupancy } from "../../types";
import { SystemTabs } from "../../../../shared/components/SystemTabs";
import { systemField } from "../../../../shared/components/systemStyles";

export type AccommodationFilter = "ALL" | "KTX" | "HOTEL";
export type OccupancyView = "GROUPED" | "LIST";

interface Props {
  occupancy: RoomOccupancy[];
  ready: boolean;
  filterType: AccommodationFilter;
  onFilter: (value: AccommodationFilter) => void;
  viewMode: OccupancyView;
  onView: (value: OccupancyView) => void;
  searchQuery: string;
  onSearch: (value: string) => void;
}

export function OccupancyToolbar({ occupancy, ready, filterType, onFilter, viewMode, onView, searchQuery, onSearch }: Props) {
  const count = (type: AccommodationFilter): number | undefined => ready ? occupancy.filter((unit) => type === "ALL" || unit.accommodation_type === type).length : undefined;
  return <section className="rounded-sm border border-slate-200 bg-white" aria-label="Tìm kiếm và lọc chỗ ở">
    <div className="flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-0 flex-1 basis-64">
        <label htmlFor="occupancy-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
        <input id="occupancy-search" type="search" value={searchQuery} onChange={(event) => onSearch(event.target.value)}
          placeholder="Tên, mã nhân sự, hộ chiếu, phòng, khách sạn…" className={systemField} />
      </div>
      <div className="w-full sm:w-44">
        <label htmlFor="occupancy-view" className="mb-1.5 block text-sm text-slate-600">Cách hiển thị</label>
        <select id="occupancy-view" value={viewMode} onChange={(event) => onView(event.target.value as OccupancyView)} className={systemField}>
          <option value="GROUPED">Theo phòng</option><option value="LIST">Theo nhân viên</option>
        </select>
      </div>
      {(searchQuery || filterType !== "ALL") && <button type="button" onClick={() => { onSearch(""); onFilter("ALL"); }}
        className="min-h-11 cursor-pointer px-1 text-sm text-slate-600 underline-offset-4 hover:underline sm:min-h-9">Xóa bộ lọc</button>}
    </div>
    <div className="border-t border-slate-200 px-4">
      <SystemTabs label="Lọc loại chỗ ở" active={filterType} onChange={onFilter} items={[
        { key: "ALL", label: "Tất cả", count: count("ALL") },
        { key: "KTX", label: "Phòng KTX", count: count("KTX") },
        { key: "HOTEL", label: "Khách sạn", count: count("HOTEL") },
      ]} />
    </div>
  </section>;
}
