import type { DailyPresenceItem } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  filteredExitedItems: DailyPresenceItem[];
  onOpenProfile: (employeeId: number) => void;
}

export function ExitedPresenceTable({ filteredExitedItems, onOpenProfile }: Props) {
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Nhân sự đang ở nước ngoài">
    <div className="overflow-x-auto" role="region" aria-label="Bảng nhân sự ở nước ngoài" tabIndex={0}>
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
        <caption className="sr-only">Nhân sự đã về nước hoặc chưa sang Việt Nam theo ngày tra cứu</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["STT", "Mã nhân sự", "Họ và tên", "Giới tính", "Bộ phận", "Ngày đã về nước", "Dự kiến sang lại", "Ghi chú", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {filteredExitedItems.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">Không tìm thấy nhân sự ở nước ngoài phù hợp với ngày tra cứu và bộ lọc.</td></tr>
            : filteredExitedItems.map((item, index) => <tr key={item.employee_id} className="hover:bg-slate-50">
              <td className="px-3 py-3 tabular-nums text-slate-500">{index + 1}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.employee_code || `#${item.employee_id}`}</td>
              <th scope="row" className="min-w-40 px-3 py-3 font-normal">
                <button type="button" onClick={() => onOpenProfile(item.employee_id)} className="cursor-pointer text-left font-medium text-slate-900 underline-offset-4 hover:underline">{item.name_latin}</button>
                {item.name_chinese && <span className="mt-0.5 block text-xs text-slate-600">{item.name_chinese}</span>}
              </th>
              <td className="px-3 py-3 text-slate-600">{item.gender || "—"}</td>
              <td className="px-3 py-3 text-slate-600">{item.department || "—"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.actual_exit_date || "—"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.expected_entry_date || "—"}</td>
              <td className="max-w-sm break-words px-3 py-3 text-slate-600">{item.notes || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => onOpenProfile(item.employee_id)} aria-label={`Xem hồ sơ ${item.name_latin}`} className={systemTextButton}>Hồ sơ</button></td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {filteredExitedItems.length} nhân sự</p>
  </section>;
}
