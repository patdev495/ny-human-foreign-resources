import { Edit3, Eye, Home, MoreHorizontal, Trash2 } from "lucide-react";
import type { ForeignEmployee } from "../../types";
import { StatusBadge } from "../../../../shared/components/StatusBadge";
import { DocBadge, PassportBadge } from "./DocBadge";

interface Props {
  employee: ForeignEmployee;
  thresholdDays: number;
  columns: string;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

const avatarColors = [
  "bg-indigo-50 text-indigo-700 border-indigo-200/90",
  "bg-sky-50 text-sky-700 border-sky-200/90",
  "bg-emerald-50 text-emerald-700 border-emerald-200/90",
  "bg-violet-50 text-violet-700 border-violet-200/90",
  "bg-amber-50 text-amber-700 border-amber-200/90",
  "bg-rose-50 text-rose-700 border-rose-200/90",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "NS";
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function EmployeeListRow({ employee, thresholdDays, columns, onOpenProfile, onEdit, onDelete }: Props) {
  const name = employee.name_latin || "Chưa có tên";

  return (
    <li className={`grid min-w-0 gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 ${columns} 2xl:items-center 2xl:gap-5`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black shadow-xs ${avatarColors[Math.abs(employee.id) % avatarColors.length]}`} aria-hidden="true">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <button type="button" onClick={() => onOpenProfile(employee)} className="break-words text-left text-sm font-bold text-slate-900 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">
            {name}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span className="max-w-full break-all rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">{employee.employee_code || "Chưa có mã"}</span>
            {employee.role && <span>{employee.role}</span>}
          </div>
          <p className="mt-1.5 break-words text-xs text-slate-500">
            {employee.department || "Chưa phân bộ phận"} · {employee.nationality || "Chưa có quốc tịch"}
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 2xl:hidden">Tình trạng & chỗ ở</span>
        <StatusBadge
          label={employee.is_in_vietnam ? "Đang ở VN" : "Đã về nước"}
          status={employee.is_in_vietnam ? "success" : "neutral"}
          pulse={employee.is_in_vietnam ?? false}
        />
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Home className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="break-words">{employee.current_room_number ? `Phòng ${employee.current_room_number}` : "Chưa xếp chỗ"}</span>
        </div>
      </div>

      <div className="min-w-0">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500 2xl:hidden">Giấy tờ pháp lý</span>
        <div className="flex flex-wrap gap-1.5">
          <PassportBadge emp={employee} threshold={thresholdDays} />
          <DocBadge dateStr={employee.latest_gpld_expiry} label="GPLĐ" threshold={thresholdDays} />
          <DocBadge dateStr={employee.latest_visa_expiry} label="Visa" threshold={thresholdDays} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 2xl:justify-end">
        <button type="button" onClick={() => onOpenProfile(employee)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600">
          <Eye className="h-4 w-4" aria-hidden="true" /> Hồ sơ
        </button>
        <details className="group relative">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden" aria-label={`Thao tác với ${name}`} title="Thao tác khác">
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            <button type="button" onClick={() => onEdit(employee)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600">
              <Edit3 className="h-4 w-4" aria-hidden="true" /> Sửa
            </button>
            <button type="button" onClick={() => onDelete(employee)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa
            </button>
          </div>
        </details>
      </div>
    </li>
  );
}
