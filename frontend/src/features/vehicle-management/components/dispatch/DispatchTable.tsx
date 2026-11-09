import type { VehicleDispatch } from "../../types";
import { analyzeDailyDispatches } from "../../utils/odometerUtils";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface DispatchTableProps {
  dispatches: VehicleDispatch[];
  onEdit: (dispatch: VehicleDispatch) => void;
  onDelete: (dispatch: VehicleDispatch) => void;
  onQuickOdo: (dispatch: VehicleDispatch) => void;
}

export function DispatchTable({ dispatches, onEdit, onDelete, onQuickOdo }: DispatchTableProps) {
  const analysis = analyzeDailyDispatches(dispatches);
  return <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
    <div role="region" aria-label="Danh sách nhật ký điều xe" tabIndex={0} className="overflow-x-auto">
      <table className="w-full min-w-[1150px] text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>{["STT", "Ngày / giờ", "Xe / tài xế", "Hành khách", "Lộ trình", "Cước (đ)", "Ghi chú", "Thao tác"].map((title, index) => <th key={title} scope="col" className={`px-4 py-3 font-medium ${index === 5 ? "text-right" : ""}`}>{title}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {dispatches.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Không có chuyến điều xe phù hợp.</td></tr>}
          {dispatches.map((dispatch, index) => {
            const company = dispatch.ownership_group === "COMPANY_OWNED";
            const info = analysis.get(dispatch.id);
            const odometer = dispatch.odometer_km ?? dispatch.start_km ?? dispatch.end_km;
            return <tr key={dispatch.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <div>{dispatch.dispatch_date.split("-").reverse().join("/")}</div>
                <div className="mt-1 text-slate-500">Đón: {dispatch.pickup_time || "—"}</div>
                <div className="text-slate-500">Về: {dispatch.return_time || "—"}</div>
              </td>
              <td className="min-w-64 px-4 py-3">
                <div className="font-medium text-slate-900">{dispatch.vehicle_name}</div>
                <div className="mt-1 text-slate-500">{dispatch.provider_name || (company ? "Xe công ty" : "Xe thuê ngoài")}{dispatch.license_plate ? ` · ${dispatch.license_plate}` : ""}</div>
                <div>{dispatch.driver_name || "Chưa có tài xế"}{dispatch.driver_phone ? ` · ${dispatch.driver_phone}` : ""}</div>
                {company && info && <div className="mt-1 space-y-1">
                  {odometer != null && <div className="text-slate-500">{info.isFirstOfDay && info.isLastOfDay ? "Đầu / cuối ngày" : info.isFirstOfDay ? "Đầu ngày" : info.isLastOfDay ? "Cuối ngày" : "Đồng hồ"}: {odometer.toLocaleString("vi-VN")} km</div>}
                  {info.warningMessage && <p className="text-amber-800">{info.warningMessage.replace(/^⚠️\s*/, "")}</p>}
                  {odometer == null && !info.isMissingRequiredOdo && <p className="text-slate-500">Chuyến giữa ngày</p>}
                </div>}
              </td>
              <td className="px-4 py-3"><div className="whitespace-pre-wrap">{dispatch.passenger_name || "—"}</div><div className="mt-1 text-slate-500">{dispatch.passenger_count} người</div></td>
              <td className="min-w-44 px-4 py-3"><div>{dispatch.pickup_location || "—"}</div><div className="mt-1">→ {dispatch.dropoff_location || "—"}</div></td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{dispatch.cost.toLocaleString("vi-VN")}</td>
              <td className="min-w-36 max-w-60 whitespace-pre-wrap break-words px-4 py-3 text-slate-500">{dispatch.notes || "—"}</td>
              <td className="px-4 py-2"><div className="flex flex-col items-start">
                {company && <button type="button" onClick={() => onQuickOdo(dispatch)} className={`${systemTextButton} whitespace-nowrap`}>Chốt km / giờ về</button>}
                <button type="button" onClick={() => onEdit(dispatch)} className={systemTextButton} aria-label={`Sửa chuyến ${dispatch.vehicle_name} ngày ${dispatch.dispatch_date}`}>Sửa</button>
                <button type="button" onClick={() => onDelete(dispatch)} className={`${systemTextButton} text-red-700`} aria-label={`Xóa chuyến ${dispatch.vehicle_name} ngày ${dispatch.dispatch_date}`}>Xóa</button>
              </div></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <div role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{dispatches.length} chuyến điều xe</div>
  </div>;
}
