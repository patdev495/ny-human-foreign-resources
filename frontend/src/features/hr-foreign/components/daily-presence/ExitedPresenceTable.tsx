import React from "react";
import type { DailyPresenceItem } from "../../types";

interface Props {
  filteredExitedItems: DailyPresenceItem[];
  onOpenProfile: (empId: number) => void;
}

export const ExitedPresenceTable: React.FC<Props> = ({
  filteredExitedItems,
  onOpenProfile,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs">
      <div className="p-4 bg-rose-50/50 border-b border-rose-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
            <span>✈️ Danh sách Nhân sự Vắng mặt tại Việt Nam (Đã về nước / Chưa sang)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold">
              {filteredExitedItems.length} người
            </span>
          </h3>
          <p className="text-xs text-rose-600 mt-0.5">
            Nhân sự hiện không ở Việt Nam (đã làm thủ tục về nước hoặc đang ở nước ngoài chờ đợt sang).
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">STT</th>
              <th className="py-3.5 px-4">Mã NV</th>
              <th className="py-3.5 px-4">Họ và tên</th>
              <th className="py-3.5 px-4">Giới tính</th>
              <th className="py-3.5 px-4">Bộ phận</th>
              <th className="py-3.5 px-4">Ngày đã về nước</th>
              <th className="py-3.5 px-4">Dự kiến sang lại</th>
              <th className="py-3.5 px-4">Ghi chú</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredExitedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                  Không có nhân sự nào đã về nước.
                </td>
              </tr>
            ) : (
              filteredExitedItems.map((item, idx) => (
                <tr key={item.employee_id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {item.employee_code || `#${item.employee_id}`}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenProfile(item.employee_id)}
                      className="font-bold text-slate-900 hover:text-rose-600 transition-colors text-left"
                    >
                      {item.name_latin}
                    </button>
                    {item.name_chinese && (
                      <p className="text-[11px] text-slate-400 font-normal">{item.name_chinese}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.gender}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.department || "—"}</td>
                  <td className="py-3 px-4 font-semibold text-rose-700">
                    {item.actual_exit_date || "—"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">
                    {item.expected_entry_date || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{item.notes || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenProfile(item.employee_id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Xem Hồ sơ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
