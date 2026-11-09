import type { ForeignEmployee } from "../../types";
import { DocBadge, PassportBadge } from "./DocBadge";

interface Props {
  employee: ForeignEmployee;
  thresholdDays: number;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

export function EmployeeListRow({ employee, thresholdDays, onOpenProfile, onEdit, onDelete }: Props) {
  const name = employee.name_latin || "Chưa có tên";
  return <tr className="align-middle hover:bg-slate-50">
    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.employee_code || "—"}</td>
    <th scope="row" className="min-w-40 px-4 py-3 font-normal">
      <button type="button" onClick={() => onOpenProfile(employee)} className="cursor-pointer text-left font-medium text-slate-900 underline-offset-4 hover:underline">{name}</button>
      {employee.name_chinese && <span className="mt-0.5 block text-xs text-slate-500">{employee.name_chinese}</span>}
    </th>
    <td className="min-w-28 max-w-44 px-4 py-3 text-slate-600">
      {employee.department || "—"}
      {employee.role && <span className="mt-0.5 block text-xs text-slate-500">{employee.role}</span>}
    </td>
    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.is_in_vietnam ? "Đang ở VN" : "Đã về nước"}</td>
    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.current_room_number ? `Phòng ${employee.current_room_number}` : "Chưa xếp chỗ"}</td>
    <td className="min-w-32 px-4 py-3"><PassportBadge emp={employee} threshold={thresholdDays} plain /></td>
    <td className="min-w-32 px-4 py-3"><DocBadge dateStr={employee.latest_visa_expiry} threshold={thresholdDays} plain /></td>
    <td className="min-w-32 px-4 py-3"><DocBadge dateStr={employee.latest_gpld_expiry} threshold={thresholdDays} plain /></td>
    <td className="whitespace-nowrap px-4 py-2">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onEdit(employee)} aria-label={`Sửa hồ sơ ${name}`} className="min-h-9 cursor-pointer text-sm text-slate-700 underline-offset-4 hover:underline">Sửa</button>
        <button type="button" onClick={() => onDelete(employee)} aria-label={`Xóa hồ sơ ${name}`} className="min-h-9 cursor-pointer text-sm text-red-700 underline-offset-4 hover:underline">Xóa</button>
      </div>
    </td>
  </tr>;
}
