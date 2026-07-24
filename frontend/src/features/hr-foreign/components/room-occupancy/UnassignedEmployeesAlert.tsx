import React from "react";
import type { ForeignEmployee } from "../../types";

interface Props {
  unassignedEmployees: ForeignEmployee[];
  onCheckIn: (empId: number) => void;
}

export const UnassignedEmployeesAlert: React.FC<Props> = ({
  unassignedEmployees,
  onCheckIn,
}) => {
  if (unassignedEmployees.length === 0) return null;

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <h3 className="text-sm font-bold text-amber-900">
            Cảnh báo: Có {unassignedEmployees.length} nhân sự đang ở Việt Nam nhưng CHƯA ĐƯỢC XẾP CHỖ Ở
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
          Cần xếp chỗ ngay
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {unassignedEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{emp.name_latin}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {emp.employee_code || "Chưa có mã"} &bull; {emp.department || "N/A"}
              </p>
            </div>
            <button
              onClick={() => onCheckIn(emp.id)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
            >
              + Xếp chỗ ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
