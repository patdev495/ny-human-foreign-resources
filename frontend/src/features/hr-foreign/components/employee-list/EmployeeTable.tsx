import React from "react";
import { Eye, Edit3, Trash2, Home, UserX } from "lucide-react";
import type { ForeignEmployee } from "../../types";
import { DocBadge, PassportBadge } from "./DocBadge";
import { StatusBadge } from "../../../../shared/components/StatusBadge";

interface Props {
  filtered: ForeignEmployee[];
  thresholdDays: number;
  onOpenProfile: (emp: ForeignEmployee) => void;
  onEdit: (emp: ForeignEmployee) => void;
  onDelete: (emp: ForeignEmployee) => void;
}

export const EmployeeTable: React.FC<Props> = ({
  filtered,
  thresholdDays,
  onOpenProfile,
  onEdit,
  onDelete,
}) => (
  <div className="modern-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left text-xs">
        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="w-14 px-5 py-3.5 text-center" scope="col">
              STT
            </th>
            <th className="min-w-56 px-5 py-3.5" scope="col">
              Nhân sự & Quốc tịch
            </th>
            <th className="min-w-36 px-5 py-3.5" scope="col">
              Hiện diện
            </th>
            <th className="min-w-36 px-5 py-3.5" scope="col">
              Chỗ ở lưu trú
            </th>
            <th className="min-w-44 px-5 py-3.5" scope="col">
              Giấy tờ cần chú ý
            </th>
            <th className="w-40 px-5 py-3.5 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <UserX className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Không tìm thấy hồ sơ nhân sự
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa tra cứu.
                </p>
              </td>
            </tr>
          ) : (
            filtered.map((emp, index) => (
              <tr
                key={emp.id}
                className="transition-colors hover:bg-slate-50/80 group"
              >
                <td className="px-5 py-4 text-center font-mono text-xs font-semibold text-slate-400">
                  {index + 1}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(emp)}
                    className="block text-left text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {emp.name_latin}
                  </button>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    {emp.employee_code && (
                      <span className="font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {emp.employee_code}
                      </span>
                    )}
                    <span>
                      {[emp.department, emp.nationality].filter(Boolean).join(" · ") ||
                        "Chưa có thông tin bộ phận"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={emp.is_in_vietnam ? "Đang ở VN" : "Đã về nước"}
                    status={emp.is_in_vietnam ? "success" : "neutral"}
                    pulse={emp.is_in_vietnam ?? false}
                  />
                </td>
                <td className="px-5 py-4">
                  {emp.current_room_number ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-semibold text-xs border border-indigo-200/80">
                      <Home className="h-3 w-3" />
                      <span>{emp.current_room_number}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa xếp chỗ</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    <PassportBadge emp={emp} threshold={thresholdDays} />
                    <DocBadge
                      dateStr={emp.latest_gpld_expiry}
                      label="GPLĐ"
                      threshold={thresholdDays}
                    />
                    <DocBadge
                      dateStr={emp.latest_visa_expiry}
                      label="Visa"
                      threshold={thresholdDays}
                    />
                  </div>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(emp)}
                      title="Xem hồ sơ chi tiết"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Hồ sơ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(emp)}
                      title="Chỉnh sửa thông tin"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(emp)}
                      title="Xóa nhân sự"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
