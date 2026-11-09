import { RotateCcw, Search, X } from "lucide-react";

export type StatusFilter = "ALL" | "IN_VN" | "RETURNED";
export type WorkTypeFilter = "ALL" | "CO_DINH" | "CONG_TAC";
export type DocumentFilter = "ALL" | "HAS_ATTENTION" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK";

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearch: (value: string) => void;
  statusFilter: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  workTypeFilter: WorkTypeFilter;
  onWorkType: (value: WorkTypeFilter) => void;
  docStatusFilter: DocumentFilter;
  onDocument: (value: DocumentFilter) => void;
  thresholdDays: number;
  onThreshold: (value: number) => void;
  counts: { total: number; inVietnam: number; returned: number; attention: number } | null;
}

const controlClass = "min-h-11 w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-800 focus:border-slate-600 sm:min-h-9 sm:text-sm";

export function EmployeeFilters({ searchQuery, onSearch, statusFilter, onStatus, workTypeFilter, onWorkType, docStatusFilter, onDocument, thresholdDays, onThreshold, counts }: EmployeeFiltersProps) {
  const statuses: { key: StatusFilter; label: string; count: number | undefined }[] = [
    { key: "ALL", label: "Tất cả", count: counts?.total },
    { key: "IN_VN", label: "Đang ở VN", count: counts?.inVietnam },
    { key: "RETURNED", label: "Đã về nước", count: counts?.returned },
  ];
  const hasFilters = Boolean(searchQuery || statusFilter !== "ALL" || workTypeFilter !== "ALL" || docStatusFilter !== "ALL");

  return <section className="rounded-sm border border-slate-200 bg-white" aria-label="Tìm kiếm và lọc nhân sự">
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_170px_210px_135px]">
      <div>
        <label htmlFor="employee-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input id="employee-search" type="search" value={searchQuery} onChange={(event) => onSearch(event.target.value)}
            placeholder="Tên, mã nhân sự, hộ chiếu, bộ phận…" className={`${controlClass} pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden`} />
          {searchQuery && <button type="button" onClick={() => onSearch("")} aria-label="Xóa từ khóa tìm kiếm"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-900">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>}
        </div>
      </div>
      <div>
        <label htmlFor="employee-work-type" className="mb-1.5 block text-sm text-slate-600">Loại hình</label>
        <select id="employee-work-type" value={workTypeFilter} onChange={(event) => onWorkType(event.target.value as WorkTypeFilter)} className={controlClass}>
          <option value="ALL">Tất cả loại hình</option><option value="CO_DINH">Cố định</option><option value="CONG_TAC">Công tác</option>
        </select>
      </div>
      <div>
        <label htmlFor="employee-doc-status" className="mb-1.5 block text-sm text-slate-600">Giấy tờ</label>
        <select id="employee-doc-status" value={docStatusFilter} onChange={(event) => onDocument(event.target.value as DocumentFilter)} className={controlClass}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="HAS_ATTENTION">Hết hạn hoặc sắp hết hạn</option>
          <option value="HAS_EXPIRED">Đã hết hạn</option><option value="HAS_WARNING">Sắp hết hạn</option>
          <option value="HAS_MISSING">Thiếu thông tin</option><option value="ALL_OK">Tất cả còn hạn</option>
        </select>
      </div>
      <div>
        <label htmlFor="employee-threshold" className="mb-1.5 block text-sm text-slate-600">Mốc cảnh báo</label>
        <select id="employee-threshold" value={thresholdDays} onChange={(event) => onThreshold(Number(event.target.value))} className={controlClass}>
          {[15, 30, 60, 90, 120].map((days) => <option key={days} value={days}>≤ {days} ngày</option>)}
        </select>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-x-4 border-t border-slate-200 px-4">
      <div className="flex flex-wrap gap-x-4" role="group" aria-label="Lọc theo hiện diện">
        {statuses.map(({ key, label, count }) => <button key={key} type="button" aria-pressed={statusFilter === key} onClick={() => onStatus(key)}
          className={`min-h-11 cursor-pointer border-b-2 py-2 text-sm ${statusFilter === key ? "border-slate-700 font-semibold text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
          {label} <span className="tabular-nums text-slate-500">({count ?? "—"})</span>
        </button>)}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" aria-pressed={docStatusFilter === "HAS_ATTENTION"} onClick={() => onDocument(docStatusFilter === "HAS_ATTENTION" ? "ALL" : "HAS_ATTENTION")}
          className={`min-h-11 cursor-pointer text-sm underline-offset-4 hover:underline ${docStatusFilter === "HAS_ATTENTION" ? "font-semibold underline" : ""} ${counts?.attention ? "text-amber-800" : "text-slate-600"}`}>
          Giấy tờ cần chú ý ({counts?.attention ?? "—"})
        </button>
        {hasFilters && <button type="button" onClick={() => { onStatus("ALL"); onWorkType("ALL"); onDocument("ALL"); onSearch(""); }}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Xóa bộ lọc
        </button>}
      </div>
    </div>
  </section>;
}
