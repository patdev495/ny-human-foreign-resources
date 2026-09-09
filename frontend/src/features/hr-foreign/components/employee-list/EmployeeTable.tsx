import React from "react";
import type { ForeignEmployee } from "../../types";
import { DocBadge, PassportBadge } from "./DocBadge";

interface Props {
  filtered: ForeignEmployee[];
  thresholdDays: number;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

const PresenceBadge: React.FC<{ isInVietnam: boolean }> = ({ isInVietnam }) => (
  <span className={isInVietnam
    ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
    : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"}>
    <span aria-hidden="true" className={isInVietnam ? "h-1.5 w-1.5 rounded-full bg-emerald-600" : "h-1.5 w-1.5 rounded-full bg-slate-500"} />
    {isInVietnam ? "Đang ở VN" : "Đã về nước"}
  </span>
);

export const EmployeeTable: React.FC<Props> = ({ filtered, thresholdDays, onOpenProfile, onEdit, onDelete }) => (
  <div className="workspace-panel overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-600">
          <tr>
            <th className="w-14 px-5 py-3.5" scope="col">STT</th>
            <th className="min-w-55 px-5 py-3.5" scope="col">NHÂN SỰ</th>
            <th className="min-w-34 px-5 py-3.5" scope="col">HIỆN DIỆN</th>
            <th className="min-w-32 px-5 py-3.5" scope="col">CHỖ Ở</th>
            <th className="min-w-40 px-5 py-3.5" scope="col">GIẤY TỜ CẦN CHÚ Ý</th>
            <th className="w-42 px-5 py-3.5 text-right" scope="col">THAO TÁC</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-600">Không có hồ sơ phù hợp với bộ lọc hiện tại.</td></tr>
          ) : filtered.map((emp, index) => (
            <tr key={emp.id} className="transition-colors hover:bg-indigo-50/35">
              <td className="px-5 py-4 font-mono text-xs text-slate-500">{index + 1}</td>
              <td className="px-5 py-4">
                <button type="button" onClick={() => onOpenProfile(emp)} className="block text-left font-semibold text-slate-900 hover:text-indigo-700">
                  {emp.name_latin}
                </button>
                <span className="mt-1 block text-xs text-slate-600">{[emp.employee_code, emp.department || emp.nationality].filter(Boolean).join(" · ") || "Chưa có thông tin bổ sung"}</span>
              </td>
              <td className="px-5 py-4"><PresenceBadge isInVietnam={emp.is_in_vietnam ?? false} /></td>
              <td className="px-5 py-4">{emp.current_room_number ? <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">{emp.current_room_number}</span> : <span className="text-slate-500">Chưa xếp chỗ</span>}</td>
              <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5"><PassportBadge emp={emp} threshold={thresholdDays} /><DocBadge dateStr={emp.latest_gpld_expiry} label="GPLĐ" threshold={thresholdDays} /><DocBadge dateStr={emp.latest_visa_expiry} label="Visa" threshold={thresholdDays} /></div></td>
              <td className="px-5 py-4 text-right whitespace-nowrap">
                <button type="button" onClick={() => onOpenProfile(emp)} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Hồ sơ</button>
                <button type="button" onClick={() => onEdit(emp)} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Sửa</button>
                <button type="button" onClick={() => onDelete(emp)} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
