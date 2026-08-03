import React from "react";
import type { VehicleDispatch } from "../../types";
import { analyzeDailyDispatches } from "../../utils/odometerUtils";

interface DispatchTableProps {
  dispatches: VehicleDispatch[];
  onEdit: (dispatch: VehicleDispatch) => void;
  onDelete: (id: number, dispatchDate: string, vehicleName: string) => void;
  onQuickOdo?: (dispatch: VehicleDispatch) => void;
}

export const DispatchTable: React.FC<DispatchTableProps> = ({
  dispatches,
  onEdit,
  onDelete,
  onQuickOdo,
}) => {
  const odoAnalysis = analyzeDailyDispatches(dispatches);

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
              dispatches.map((d, index) => {
                const isCompanyOwned = d.ownership_group === "COMPANY_OWNED";
                const odoVal = d.odometer_km ?? d.start_km ?? d.end_km;
                const hasOdo = odoVal !== undefined && odoVal !== null;
                const odoInfo = odoAnalysis.get(d.id);

                return (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{d.dispatch_date}</div>
                      <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                        <span>🕒 {d.pickup_time || "—"}</span>
                        {d.return_time && <span className="text-blue-700 font-bold">➔ {d.return_time}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {isCompanyOwned ? (
                          <span className="text-blue-600">🏢</span>
                        ) : (
                          <span className="text-amber-600">🚕</span>
                        )}
                        {d.vehicle_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        TX: {d.driver_name || "Chưa chọn"} {d.license_plate ? `(${d.license_plate})` : ""}
                        {d.driver_phone ? <span className="font-mono text-slate-600"> • 📞 {d.driver_phone}</span> : ""}
                      </div>

                      {/* Smart Odometer Status Badges for Company Owned Vehicles */}
                      {isCompanyOwned && odoInfo && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {odoInfo.warningMessage && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {odoInfo.warningMessage}
                            </span>
                          )}
                          {hasOdo && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono bg-sky-50 text-sky-700 font-bold border border-sky-200">
                              📟 {odoInfo.isFirstOfDay && odoInfo.isLastOfDay ? "Đồng hồ Đầu & Cuối ngày: " : odoInfo.isFirstOfDay ? "Đồng hồ Đầu ngày: " : odoInfo.isLastOfDay ? "Đồng hồ Cuối ngày: " : "Đồng hồ: "}
                              {odoVal?.toLocaleString("vi-VN")} KM
                            </span>
                          )}
                          {!hasOdo && !odoInfo.isMissingRequiredOdo && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium text-slate-500 bg-slate-100 border border-slate-200">
                              ⚪ Chuyến giữa ngày
                            </span>
                          )}
                          {onQuickOdo && (odoInfo.isMissingRequiredOdo || odoInfo.isMissingRequiredTime || !hasOdo) && (
                            <button
                              type="button"
                              onClick={() => onQuickOdo(d)}
                              className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
                            >
                              📟 Chốt KM & Giờ Về
                            </button>
                          )}
                        </div>
                      )}
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
                        {isCompanyOwned && onQuickOdo && (
                          <button
                            onClick={() => onQuickOdo(d)}
                            className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                            title="Chốt KM Đồng hồ"
                          >
                            📟
                          </button>
                        )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
