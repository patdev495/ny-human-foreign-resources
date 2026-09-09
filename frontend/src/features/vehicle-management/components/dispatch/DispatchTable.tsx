import React from "react";
import {
  Clock,
  ArrowRight,
  Building2,
  Car,
  Phone,
  Gauge,
  Edit3,
  Trash2,
  AlertTriangle,
} from "lucide-react";
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
    <div className="executive-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3.5 w-12 text-center" scope="col">STT</th>
              <th className="p-3.5" scope="col">Ngày & Giờ điều xe</th>
              <th className="p-3.5" scope="col">Loại xe & Tài xế</th>
              <th className="p-3.5" scope="col">Hành khách</th>
              <th className="p-3.5" scope="col">Lộ trình di chuyển</th>
              <th className="p-3.5 text-right" scope="col">Chi phí cước</th>
              <th className="p-3.5" scope="col">Ghi chú</th>
              <th className="p-3.5 text-center w-28" scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dispatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2">
                    <Car className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-slate-600">Chưa có nhật ký điều xe nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Các chuyến điều xe tạo mới sẽ xuất hiện ở đây.</p>
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
                    <td className="p-3.5 text-center font-mono text-xs font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{d.dispatch_date}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{d.pickup_time || "—"}</span>
                        {d.return_time && (
                          <>
                            <ArrowRight className="h-2.5 w-2.5 text-cyan-600" />
                            <span className="text-cyan-700 font-bold">{d.return_time}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] ${
                            isCompanyOwned
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isCompanyOwned ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <Car className="h-3 w-3" />
                          )}
                        </span>
                        <span>{d.vehicle_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span>TX: {d.driver_name || "Chưa chọn"}</span>
                        {d.license_plate ? ` (${d.license_plate})` : ""}
                        {d.driver_phone && (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600 ml-1.5">
                            <Phone className="h-2.5 w-2.5 text-slate-400" />
                            {d.driver_phone}
                          </span>
                        )}
                      </div>

                      {/* Smart Odometer Badges */}
                      {isCompanyOwned && odoInfo && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {odoInfo.warningMessage && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                              <span>{odoInfo.warningMessage}</span>
                            </span>
                          )}
                          {hasOdo && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono bg-cyan-50 text-cyan-800 font-bold border border-cyan-200/80">
                              <Gauge className="h-3 w-3 text-cyan-600" />
                              <span>
                                {odoInfo.isFirstOfDay && odoInfo.isLastOfDay
                                  ? "Đầu & Cuối: "
                                  : odoInfo.isFirstOfDay
                                  ? "Đầu ngày: "
                                  : odoInfo.isLastOfDay
                                  ? "Cuối ngày: "
                                  : "KM: "}
                                {odoVal?.toLocaleString("vi-VN")} KM
                              </span>
                            </span>
                          )}
                          {!hasOdo && !odoInfo.isMissingRequiredOdo && (
                            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-medium text-slate-500 bg-slate-100 border border-slate-200">
                              Chuyến giữa ngày
                            </span>
                          )}
                          {onQuickOdo &&
                            (odoInfo.isMissingRequiredOdo ||
                              odoInfo.isMissingRequiredTime ||
                              !hasOdo) && (
                              <button
                                type="button"
                                onClick={() => onQuickOdo(d)}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
                              >
                                <Gauge className="h-2.5 w-2.5" />
                                <span>Chốt KM & Giờ Về</span>
                              </button>
                            )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">
                        {d.passenger_name || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Số lượng: {d.passenger_count} người
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <span className="text-emerald-700 font-semibold">
                          {d.pickup_location || "—"}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-cyan-700 font-semibold">
                          {d.dropoff_location || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right mono-metric font-bold text-slate-900">
                      {d.cost > 0 ? (
                        <span className="text-emerald-600">
                          {d.cost.toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        <span className="text-slate-400">0 đ</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-[200px] truncate text-[11px]">
                      {d.notes || "—"}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isCompanyOwned && onQuickOdo && (
                          <button
                            type="button"
                            onClick={() => onQuickOdo(d)}
                            className="p-1.5 text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                            title="Chốt KM Đồng hồ"
                          >
                            <Gauge className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(d)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa chuyến"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(d.id, d.dispatch_date, d.vehicle_name)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa chuyến"
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
    </div>
  );
};
