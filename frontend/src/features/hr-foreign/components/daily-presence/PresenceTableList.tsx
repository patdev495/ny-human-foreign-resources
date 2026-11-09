import type { DailyPresenceItem } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  filteredItems: DailyPresenceItem[];
  onOpenProfile: (employeeId: number) => void;
}

export function PresenceTableList({ filteredItems, onOpenProfile }: Props) {
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Nhân sự đang ở Việt Nam">
    <div className="overflow-x-auto" role="region" aria-label="Bảng hiện diện nhân sự" tabIndex={0}>
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <caption className="sr-only">Nhân sự hiện diện tại Việt Nam và chỗ ở theo ngày tra cứu</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["STT", "Mã nhân sự", "Họ và tên", "Giới tính", "Bộ phận", "Loại chỗ ở", "Phòng / Khách sạn", "Vị trí giường", "Loại hình", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {filteredItems.length === 0 ? <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-600">Không tìm thấy nhân sự phù hợp với ngày tra cứu và bộ lọc.</td></tr>
            : filteredItems.map((item, index) => {
              const unassigned = !item.room_number && !item.hotel_name;
              return <tr key={item.employee_id} className="hover:bg-slate-50">
                <td className="px-3 py-3 tabular-nums text-slate-500">{index + 1}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.employee_code || `#${item.employee_id}`}</td>
                <th scope="row" className="min-w-40 px-3 py-3 font-normal">
                  <button type="button" onClick={() => onOpenProfile(item.employee_id)} className="cursor-pointer text-left font-medium text-slate-900 underline-offset-4 hover:underline">{item.name_latin}</button>
                  {item.name_chinese && <span className="mt-0.5 block text-xs text-slate-600">{item.name_chinese}</span>}
                </th>
                <td className="px-3 py-3 text-slate-600">{item.gender || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{item.department || "—"}</td>
                <td className={`px-3 py-3 ${unassigned ? "text-amber-800" : "text-slate-600"}`}>{unassigned ? "Chưa xếp chỗ" : item.accommodation_type === "KTX" ? "KTX" : "Khách sạn"}</td>
                <td className="px-3 py-3 text-slate-700">{item.location_name || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{item.bed_location || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{item.stay_type === "CONG_TAC" ? "Công tác" : item.stay_type === "CO_DINH" ? "Cố định" : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => onOpenProfile(item.employee_id)} aria-label={`Xem hồ sơ ${item.name_latin}`} className={systemTextButton}>Hồ sơ</button></td>
              </tr>;
            })}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {filteredItems.length} nhân sự</p>
  </section>;
}
