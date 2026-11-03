import type { ForeignEmployee } from "../../types";
import { EmployeeListRow } from "./EmployeeListRow";

interface Props {
  filtered: ForeignEmployee[];
  thresholdDays: number;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

const columns = "2xl:grid 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto]";

export function EmployeeTable({ filtered, thresholdDays, onOpenProfile, onEdit, onDelete }: Props) {
  return (
    <section className="executive-card min-w-0 border border-slate-200/85 shadow-sm" aria-label="Danh sách hồ sơ nhân sự">
      <div className={`hidden ${columns} gap-5 border-b border-slate-200/90 bg-slate-50/90 px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500`} aria-hidden="true">
        <span>Nhân sự & định danh</span>
        <span>Tình trạng & chỗ ở</span>
        <span>Giấy tờ pháp lý</span>
        <span className="text-right">Thao tác</span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-bold text-slate-800">Không tìm thấy hồ sơ nhân sự phù hợp</p>
          <p className="mt-1.5 text-xs text-slate-500">Thử từ khóa khác hoặc điều chỉnh bộ lọc phía trên.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 bg-white">
          {filtered.map((emp) => (
            <EmployeeListRow
              key={emp.id}
              employee={emp}
              thresholdDays={thresholdDays}
              columns={columns}
              onOpenProfile={onOpenProfile}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}

      {filtered.length > 0 && (
        <div className="border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 text-xs text-slate-600">
          Hiển thị <span className="font-bold font-mono text-slate-800">{filtered.length}</span> hồ sơ nhân sự
        </div>
      )}
    </section>
  );
}
