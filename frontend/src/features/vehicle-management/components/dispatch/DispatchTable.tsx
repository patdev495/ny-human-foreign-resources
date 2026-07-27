import React from "react";
import type { VehicleDispatch } from "../../types";

interface DispatchTableProps {
  dispatches: VehicleDispatch[];
  onEdit: (dispatch: VehicleDispatch) => void;
  onDelete: (id: number, dispatchDate: string, vehicleName: string) => void;
}

export const DispatchTable: React.FC<DispatchTableProps> = ({ dispatches, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3 w-12 text-center">STT</th>
              <th className="p-3">Ngày & Giờ điều xe</th>
              <th className="p-3">Loại xe / Tài xế</th>
              <th className="p-3">Hành khách</th>
              <th className="p-3">Điểm đi ➔ Điểm đến</th>
              <th className="p-3 text-right">Chi phí thực tế</th>
              <th className="p-3">Ghi chú</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dispatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  Chưa có nhật ký điều xe nào.
                </td>
              </tr>
            ) : (
              dispatches.map((d, index) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-medium text-slate-400">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{d.dispatch_date}</div>
                    {d.pickup_time && (
                      <div className="text-[11px] text-slate-500 font-mono">🕒 {d.pickup_time}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      {d.ownership_group === "COMPANY_OWNED" ? (
                        <span className="text-blue-600">🏢</span>
                      ) : (
                        <span className="text-amber-600">🚕</span>
                      )}
                      {d.vehicle_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      TX: {d.driver_name || "Chưa chọn"} {d.license_plate ? `(${d.license_plate})` : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{d.passenger_name || "—"}</div>
                    <div className="text-[11px] text-slate-500">Số lượng: {d.passenger_count} người</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">
                      <span className="text-emerald-700 font-semibold">{d.pickup_location || "—"}</span>
                      <span className="mx-1 text-slate-400">➔</span>
                      <span className="text-blue-700 font-semibold">{d.dropoff_location || "—"}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {d.cost > 0 ? (
                      <span className="text-emerald-600">{d.cost.toLocaleString("vi-VN")} đ</span>
                    ) : (
                      <span className="text-slate-400">0 đ</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 max-w-[200px] truncate">{d.notes || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(d)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(d.id, d.dispatch_date, d.vehicle_name)}
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
