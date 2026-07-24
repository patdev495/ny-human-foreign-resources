import React from "react";
import type { DailyPresenceItem } from "../../types";

interface Props {
  filteredItems: DailyPresenceItem[];
  onOpenProfile: (empId: number) => void;
}

export const PresenceTableList: React.FC<Props> = ({
  filteredItems,
  onOpenProfile,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">STT</th>
              <th className="py-3.5 px-4">Mã NV</th>
              <th className="py-3.5 px-4">Họ và tên</th>
              <th className="py-3.5 px-4">Giới tính</th>
              <th className="py-3.5 px-4">Bộ phận</th>
              <th className="py-3.5 px-4">Loại chỗ ở</th>
              <th className="py-3.5 px-4">Vị trí / Chỗ ở cụ thể</th>
              <th className="py-3.5 px-4">Vị trí giường</th>
              <th className="py-3.5 px-4">Loại hình</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                  Không tìm thấy nhân sự nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr key={item.employee_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {item.employee_code || `#${item.employee_id}`}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenProfile(item.employee_id)}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {item.name_latin}
                    </button>
                    {item.name_chinese && (
                      <p className="text-[11px] text-slate-400 font-normal">{item.name_chinese}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.gender}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.department || "—"}</td>
                  <td className="py-3 px-4">
                    {item.accommodation_type === "KTX" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🏢 KTX
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        🏨 Khách sạn
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {item.location_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.bed_location || "—"}</td>
                  <td className="py-3 px-4">
                    {item.stay_type === "CONG_TAC" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Công tác
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Cố định
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenProfile(item.employee_id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
