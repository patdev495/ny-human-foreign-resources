import React from "react";
import type { ForeignEmployee } from "../../types";
import { getVisaLabel } from "../../types";
import { DocBadge, PassportBadge } from "./DocBadge";

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
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-3">STT</th>
            <th className="py-3 px-3">Họ và tên</th>
            <th className="py-3 px-3">Mã NV</th>
            <th className="py-3 px-3">Loại hình</th>
            <th className="py-3 px-3">Trạng thái VN</th>
            <th className="py-3 px-3">Chỗ ở hiện tại</th>
            <th className="py-3 px-3">Hộ chiếu</th>
            <th className="py-3 px-3">Hợp đồng</th>
            <th className="py-3 px-3">GPLĐ</th>
            <th className="py-3 px-3">Visa / Miễn thị thực</th>
            <th className="py-3 px-3">Tạm trú (TRC)</th>
            <th className="py-3 px-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={12} className="py-8 text-center text-slate-400 italic">
                Không tìm thấy nhân sự nước ngoài nào phù hợp.
              </td>
            </tr>
          ) : (
            filtered.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>

                {/* Tên & Quốc tịch */}
                <td className="py-3 px-3">
                  <button
                    onClick={() => onOpenProfile(emp)}
                    className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-left block"
                  >
                    {emp.name_latin}
                  </button>
                  {emp.name_chinese && (
                    <span className="text-[11px] text-slate-400 block font-normal">
                      {emp.name_chinese}
                    </span>
                  )}
                  {emp.nationality && (
                    <span className="text-[10px] text-slate-400 block">{emp.nationality}</span>
                  )}
                </td>

                {/* Mã NV */}
                <td className="py-3 px-3 font-mono font-bold text-slate-700">
                  {emp.employee_code || "—"}
                </td>

                {/* Loại hình */}
                <td className="py-3 px-3">
                  {emp.work_type === "CONG_TAC" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      🔸 Công tác
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      🔹 Cố định
                    </span>
                  )}
                </td>

                {/* Trạng thái ở VN */}
                <td className="py-3 px-3">
                  {emp.is_in_vietnam ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Đang ở VN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Đã về nước
                    </span>
                  )}
                </td>

                {/* Chỗ ở hiện tại */}
                <td className="py-3 px-3">
                  {emp.current_room_number ? (
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {emp.current_room_number}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Chưa xếp</span>
                  )}
                </td>

                {/* Hộ chiếu */}
                <td className="py-3 px-3">
                  <PassportBadge emp={emp} threshold={thresholdDays} />
                </td>

                {/* Hợp đồng */}
                <td className="py-3 px-3">
                  <DocBadge dateStr={emp.latest_contract_expiry} threshold={thresholdDays} />
                </td>

                {/* GPLĐ */}
                <td className="py-3 px-3">
                  <DocBadge dateStr={emp.latest_gpld_expiry} threshold={thresholdDays} />
                </td>

                {/* Visa */}
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    {emp.latest_visa_type && (
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {getVisaLabel(emp.latest_visa_type)}
                      </span>
                    )}
                    <DocBadge dateStr={emp.latest_visa_expiry} threshold={thresholdDays} />
                  </div>
                </td>

                {/* Tạm trú */}
                <td className="py-3 px-3">
                  <DocBadge dateStr={emp.latest_tamtru_expiry} threshold={thresholdDays} />
                </td>

                {/* Thao tác */}
                <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                  <button
                    onClick={() => onOpenProfile(emp)}
                    className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                  >
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => onEdit(emp)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(emp)}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
