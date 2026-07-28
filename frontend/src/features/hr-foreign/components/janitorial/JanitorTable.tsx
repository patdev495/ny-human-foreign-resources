import React from "react";
import type { ForeignEmployee } from "../../types";

interface JanitorTableProps {
  janitors: ForeignEmployee[];
  loading: boolean;
  onEdit: (janitor: ForeignEmployee) => void;
  onDelete: (janitor: ForeignEmployee) => void;
}

export const JanitorTable: React.FC<JanitorTableProps> = ({ janitors, loading, onEdit, onDelete }) => {
  const getLocationBadge = (loc?: string | null) => {
    switch (loc) {
      case "DORMITORY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            🏫 KTX (Ký túc xá)
          </span>
        );
      case "CN09":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
            🏭 Nhà máy CN09
          </span>
        );
      case "CN15":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 inline-flex items-center gap-1">
            🏭 Nhà máy CN15
          </span>
        );
      case "COMPANY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            🏢 Văn phòng Công ty
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {loc || "KTX"}
          </span>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-xs text-slate-500">Đang tải danh sách nhân sự tạp vụ...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3 w-12 text-center">STT</th>
              <th className="p-3">Mã NV</th>
              <th className="p-3">Họ và tên</th>
              <th className="p-3">Nơi làm việc</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right">Mức lương quy định</th>
              <th className="p-3">Chức danh / Ghi chú</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {janitors.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  Không tìm thấy nhân sự tạp vụ phù hợp.
                </td>
              </tr>
            ) : (
              janitors.map((j, idx) => (
                <tr
                  key={j.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    j.status === "RESIGNED" ? "bg-slate-50/60 opacity-80" : ""
                  }`}
                >
                  <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{j.employee_code || "—"}</td>
                  <td className="p-3 font-bold text-slate-900 text-sm">{j.name_latin}</td>
                  <td className="p-3">{getLocationBadge(j.workplace_location)}</td>
                  <td className="p-3">
                    {j.status === "RESIGNED" ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                        🛑 Đã nghỉ ({j.resignation_date ? j.resignation_date.split("-").reverse().join("/") : "—"})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        ✅ Đang làm việc
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    {j.salary ? (
                      <span className="text-emerald-700 font-mono">
                        {j.salary.toLocaleString("vi-VN")} đ / {j.salary_unit === "DAY" ? "ngày" : "tháng"}
                      </span>
                    ) : (
                      <span className="text-slate-400">Chưa cài</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-700">{j.role || "Tạp vụ"}</div>
                    {j.notes && <div className="text-[11px] text-slate-400">{j.notes}</div>}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(j)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(j)}
                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        🗑️
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
};
