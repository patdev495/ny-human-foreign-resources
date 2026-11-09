import type { ForeignEmployee } from "../../types";
import { janitorLocationLabel } from "./janitorUtils";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface JanitorTableProps {
  janitors: ForeignEmployee[];
  loading: boolean;
  onEdit: (janitor: ForeignEmployee) => void;
  onDelete: (janitor: ForeignEmployee) => void;
}

export function JanitorTable({ janitors, loading, onEdit, onDelete }: JanitorTableProps) {
  if (loading) return <p role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải hồ sơ tạp vụ…</p>;
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Danh sách hồ sơ tạp vụ">
    <div className="overflow-x-auto" role="region" aria-label="Bảng hồ sơ tạp vụ" tabIndex={0}>
      <table className="w-full min-w-[1020px] text-left text-sm">
        <caption className="sr-only">Hồ sơ, nơi làm việc và mức lương nhân sự tạp vụ</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["STT", "Mã nhân sự", "Họ và tên", "Nơi làm việc", "Trạng thái", "Mức lương", "Chức danh / Ghi chú", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {janitors.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600">Không tìm thấy tạp vụ phù hợp với bộ lọc.</td></tr>
            : janitors.map((janitor, index) => <tr key={janitor.id} className="hover:bg-slate-50">
              <td className="px-3 py-3 tabular-nums text-slate-500">{index + 1}</td>
              <td className="px-3 py-3 text-slate-600">{janitor.employee_code || "—"}</td>
              <th scope="row" className="min-w-40 px-3 py-3 font-normal"><button type="button" onClick={() => onEdit(janitor)} className="cursor-pointer text-left font-medium text-slate-900 underline-offset-4 hover:underline">{janitor.name_latin}</button>
                {janitor.name_chinese && <span className="mt-0.5 block text-xs text-slate-600">{janitor.name_chinese}</span>}</th>
              <td className="px-3 py-3 text-slate-600">{janitorLocationLabel(janitor.workplace_location)}</td>
              <td className="px-3 py-3 text-slate-600">{janitor.status === "RESIGNED" ? <>Đã nghỉ việc<span className="mt-0.5 block text-xs">{janitor.resignation_date || "Chưa có ngày nghỉ"}</span></> : "Đang làm việc"}</td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-700">{janitor.salary ? `${janitor.salary.toLocaleString("vi-VN")} đ / ${janitor.salary_unit === "DAY" ? "ngày" : "tháng"}` : "Chưa cài đặt"}</td>
              <td className="max-w-72 break-words px-3 py-3 text-slate-700">{janitor.role || "Tạp vụ"}{janitor.notes && <span className="mt-1 block text-xs text-slate-600">{janitor.notes}</span>}</td>
              <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => onEdit(janitor)} aria-label={`Sửa hồ sơ ${janitor.name_latin}`} className={systemTextButton}>Sửa</button>
                <button type="button" onClick={() => onDelete(janitor)} aria-label={`Xóa hồ sơ ${janitor.name_latin}`} className="ml-4 min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9">Xóa</button></td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {janitors.length} nhân sự tạp vụ</p>
  </section>;
}
