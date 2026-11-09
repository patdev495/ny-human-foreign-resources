import type { ForeignEmployee } from "../../types";
import { EmployeeListRow } from "./EmployeeListRow";

interface Props {
  filtered: ForeignEmployee[];
  thresholdDays: number;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

export function EmployeeTable({ filtered, thresholdDays, onOpenProfile, onEdit, onDelete }: Props) {
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Danh sách hồ sơ nhân sự">
    <p id="employee-table-help" className="sr-only">Bảng có thể cuộn ngang để xem đầy đủ giấy tờ và thao tác. Bấm tên nhân sự để mở hồ sơ chi tiết.</p>
    <div className="overflow-x-auto rounded-t-sm" role="region" aria-label="Bảng nhân sự" aria-describedby="employee-table-help" tabIndex={0}>
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <caption className="sr-only">Hồ sơ nhân sự nước ngoài và tình trạng giấy tờ pháp lý</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {["Mã nhân sự", "Họ và tên", "Bộ phận", "Hiện diện", "Chỗ ở", "Hộ chiếu", "Visa", "GPLĐ", "Thao tác"].map((label) =>
              <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-600">
            Không tìm thấy hồ sơ phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.
          </td></tr> : filtered.map((emp) => <EmployeeListRow key={emp.id} employee={emp} thresholdDays={thresholdDays}
            onOpenProfile={onOpenProfile} onEdit={onEdit} onDelete={onDelete} />)}
        </tbody>
      </table>
    </div>
    <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600" role="status">
      Hiển thị <span className="font-medium tabular-nums text-slate-900">{filtered.length}</span> hồ sơ
    </div>
  </section>;
}
