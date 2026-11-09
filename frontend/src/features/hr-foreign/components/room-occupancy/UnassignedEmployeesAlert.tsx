import type { ForeignEmployee } from "../../types";
import { ChevronDown } from "lucide-react";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  unassignedEmployees: ForeignEmployee[];
  onCheckIn: (empId: number) => void;
}

export function UnassignedEmployeesAlert({ unassignedEmployees, onCheckIn }: Props) {
  if (unassignedEmployees.length === 0) return null;
  return <details className="group rounded-sm border border-amber-200 bg-white">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-amber-900 [&::-webkit-details-marker]:hidden">
      <span><strong className="font-semibold">{unassignedEmployees.length} nhân sự chưa xếp chỗ ở</strong><span className="hidden font-normal sm:inline"> · Đã hoặc sắp đến Việt Nam</span></span>
      <span className="flex shrink-0 items-center gap-2 text-slate-600"><span className="text-xs">Xem danh sách</span><ChevronDown className="h-4 w-4 group-open:rotate-180" aria-hidden="true" /></span>
    </summary>
    <ul className="divide-y divide-slate-200 border-t border-amber-200">
      {unassignedEmployees.map((emp) => <li key={emp.id} className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 text-sm">
          <p className="break-words font-medium text-slate-900">{emp.name_latin}</p>
          <p className="mt-1 break-words text-xs text-slate-600">{emp.employee_code || "Chưa có mã"} · {emp.department || "Chưa có bộ phận"}{emp.entry_date && ` · Ngày đến ${emp.entry_date}`}</p>
        </div>
        <button type="button" onClick={() => onCheckIn(emp.id)} aria-label={`Xếp chỗ cho ${emp.name_latin}`} className={`${systemTextButton} shrink-0`}>Xếp chỗ</button>
      </li>)}
    </ul>
  </details>;
}
