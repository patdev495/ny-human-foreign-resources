import type { ForeignEmployee, ResidentInfo, RoomOccupancy } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  filteredOccupancy: RoomOccupancy[];
  employees: ForeignEmployee[];
  onCheckOut: (res: ResidentInfo, unitName: string) => void;
}

export function FlatResidentTableView({ filteredOccupancy, employees, onCheckOut }: Props) {
  const residents = filteredOccupancy.flatMap((unit) => {
    const title = unit.accommodation_type === "HOTEL" ? unit.unit_name : `Phòng ${unit.unit_name}`;
    return [
      ...unit.active_residents.map((res) => ({ ...res, scheduled: false })),
      ...unit.scheduled_residents.map((res) => ({ ...res, scheduled: true })),
    ].map((res) => ({ ...res, title, accommodationType: unit.accommodation_type }));
  });
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Nhân sự đã xếp chỗ">
    <div className="overflow-x-auto" role="region" aria-label="Bảng lưu trú theo nhân viên" tabIndex={0}>
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <caption className="sr-only">Nhân sự đang ở và sắp đến theo chỗ ở</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["STT", "Mã nhân sự", "Họ và tên", "Hộ chiếu", "Bộ phận", "Loại chỗ ở", "Phòng / Khách sạn", "Vị trí giường", "Loại hình", "Trạng thái", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {residents.length === 0 ? <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600">Không tìm thấy người đã xếp chỗ phù hợp.</td></tr>
            : residents.map((res, index) => {
              const emp = employees.find((employee) => employee.id === res.employee_id);
              return <tr key={`${res.accommodationType}-${res.stay_id}`} className="hover:bg-slate-50">
                <td className="px-3 py-3 tabular-nums text-slate-500">{index + 1}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{emp?.employee_code || `#${res.employee_id}`}</td>
                <th scope="row" className="min-w-40 px-3 py-3 font-medium text-slate-900">{res.name_latin}{res.name_chinese && <span className="block text-xs font-normal text-slate-600">{res.name_chinese}</span>}</th>
                <td className="px-3 py-3 text-slate-600">{res.passport_number || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{emp?.department || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{res.accommodationType === "KTX" ? "KTX" : "Khách sạn"}</td>
                <td className="px-3 py-3 text-slate-700">{res.title}</td>
                <td className="px-3 py-3 text-slate-600">{res.bed_location || "—"}</td>
                <td className="px-3 py-3 text-slate-600">{res.stay_type === "CONG_TAC" ? "Công tác" : "Cố định"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{res.scheduled ? "Sắp đến" : "Đang ở"}</td>
                <td className="px-3 py-2">{!res.scheduled && <button type="button" onClick={() => onCheckOut(res, res.title)} aria-label={`Trả phòng cho ${res.name_latin}`} className={`${systemTextButton} whitespace-nowrap`}>Trả phòng</button>}</td>
              </tr>;
            })}
        </tbody>
      </table>
    </div>
    <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600" role="status">Hiển thị {residents.length} nhân sự đã xếp chỗ</p>
  </section>;
}
