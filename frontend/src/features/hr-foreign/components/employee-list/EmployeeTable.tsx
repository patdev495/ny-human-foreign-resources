import React from "react";
import { Eye, Edit3, Trash2, Home, UserX, Building2, Globe2 } from "lucide-react";
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

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "NS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarColorPalettes = [
  "bg-indigo-50 text-indigo-700 border-indigo-200/90",
  "bg-sky-50 text-sky-700 border-sky-200/90",
  "bg-emerald-50 text-emerald-700 border-emerald-200/90",
  "bg-violet-50 text-violet-700 border-violet-200/90",
  "bg-amber-50 text-amber-700 border-amber-200/90",
  "bg-rose-50 text-rose-700 border-rose-200/90",
  "bg-teal-50 text-teal-700 border-teal-200/90",
];

const getAvatarColor = (id: number): string => {
  return avatarColorPalettes[Math.abs(id) % avatarColorPalettes.length];
};

export const EmployeeTable: React.FC<Props> = ({
  filtered,
  thresholdDays,
  onOpenProfile,
  onEdit,
  onDelete,
}) => (
  <div className="executive-card overflow-hidden border border-slate-200/85 shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-xs">
        <thead className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
          <tr>
            <th className="w-14 px-5 py-4 text-center" scope="col">
              STT
            </th>
            <th className="min-w-64 px-5 py-4" scope="col">
              Nhân sự & Định danh
            </th>
            <th className="min-w-40 px-5 py-4" scope="col">
              Bộ phận & Quốc tịch
            </th>
            <th className="min-w-36 px-5 py-4" scope="col">
              Tình trạng Lưu trú
            </th>
            <th className="min-w-36 px-5 py-4" scope="col">
              Chỗ ở KTX / Khách sạn
            </th>
            <th className="min-w-48 px-5 py-4" scope="col">
              Hạn Giấy tờ Pháp lý
            </th>
            <th className="w-44 px-5 py-4 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-20 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/90 text-slate-400 border border-slate-200/60 shadow-inner">
                  <UserX className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-800">
                  Không tìm thấy hồ sơ nhân sự nào phù hợp
                </p>
                <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh các tiêu chí bộ lọc phía trên.
                </p>
              </td>
            </tr>
          ) : (
            filtered.map((emp, index) => {
              const avatarColor = getAvatarColor(emp.id);
              const initials = getInitials(emp.name_latin || "NS");

              return (
                <tr
                  key={emp.id}
                  className="table-row-executive transition-colors duration-150 group hover:bg-slate-50/70"
                >
                  {/* STT */}
                  <td className="px-5 py-4 text-center font-mono text-xs font-semibold text-slate-400">
                    {index + 1}
                  </td>

                  {/* Nhân sự & Avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center font-black text-xs shadow-xs ${avatarColor}`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onOpenProfile(emp)}
                          className="block text-left text-[13px] font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                        >
                          {emp.name_latin}
                        </button>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {emp.employee_code ? (
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              {emp.employee_code}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có mã</span>
                          )}
                          {emp.role && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                              · {emp.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bộ phận & Quốc tịch */}
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {emp.department || "Chưa phân bộ phận"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Globe2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{emp.nationality || "Chưa có"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Hiện diện */}
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={emp.is_in_vietnam ? "Đang ở VN" : "Đã về nước"}
                      status={emp.is_in_vietnam ? "success" : "neutral"}
                      pulse={emp.is_in_vietnam ?? false}
                    />
                  </td>

                  {/* Phòng ở lưu trú */}
                  <td className="px-5 py-4">
                    {emp.current_room_number ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200/80 shadow-2xs">
                        <Home className="h-3.5 w-3.5" />
                        <span>{emp.current_room_number}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-slate-400 bg-slate-100/60 italic border border-slate-200/40">
                        Chưa xếp chỗ
                      </span>
                    )}
                  </td>

                  {/* Giấy tờ pháp lý */}
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

                  {/* Thao tác */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(emp)}
                        title="Xem hồ sơ chi tiết"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/70 transition-all cursor-pointer shadow-2xs active:scale-97"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Hồ sơ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(emp)}
                        title="Chỉnh sửa thông tin"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer active:scale-97"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(emp)}
                        title="Xóa nhân sự"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer active:scale-97"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* Table Footer Summary Bar */}
    {filtered.length > 0 && (
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200/80 bg-slate-50/60 text-xs text-slate-500">
        <span className="font-medium">
          Hiển thị <span className="font-bold text-slate-800 font-mono">{filtered.length}</span> hồ sơ nhân sự
        </span>
        <span className="text-[11px] text-slate-400">
          * Nhấn vào tên hoặc nút &quot;Hồ sơ&quot; để xem toàn bộ lịch sử lưu trú & giấy tờ
        </span>
      </div>
    )}
  </div>
);
