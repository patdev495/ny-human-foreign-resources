import type { VehicleDispatch } from "../../types";
import type { OdoTripInfo } from "../../utils/odometerUtils";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface StatsDispatchTableProps {
  dispatches: VehicleDispatch[];
  analysis?: Map<number, OdoTripInfo>;
  onQuickOdo?: (dispatch: VehicleDispatch) => void;
}

export function StatsDispatchTable({ dispatches, analysis, onQuickOdo }: StatsDispatchTableProps) {
  const company = analysis !== undefined;
  const total = dispatches.reduce((sum, item) => sum + (item.cost || 0), 0);
  return <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
    <div role="region" aria-label={company ? "Bảng kê chuyến xe công ty" : "Bảng kê chuyến xe thuê ngoài"} tabIndex={0} className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50"><tr>
          {["STT", "Ngày / giờ", "Xe / tài xế", "Hành khách", "Lộ trình", ...(company ? ["Đồng hồ / giờ về"] : []), "Cước (đ)", "Ghi chú"].map(title => <th key={title} scope="col" className={`px-4 py-3 font-medium ${title === "Cước (đ)" ? "text-right" : ""}`}>{title}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {dispatches.length === 0 && <tr><td colSpan={company ? 8 : 7} className="px-4 py-10 text-center text-slate-500">Không có chuyến xe phù hợp.</td></tr>}
          {dispatches.map((dispatch, index) => {
            const info = analysis?.get(dispatch.id);
            const odometer = dispatch.odometer_km ?? dispatch.start_km ?? dispatch.end_km;
            return <tr key={dispatch.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td>
              <td className="whitespace-nowrap px-4 py-3"><div>{dispatch.dispatch_date.split("-").reverse().join("/")}</div><div className="mt-1 text-slate-500">Đón: {dispatch.pickup_time || "—"}</div><div className="text-slate-500">Về: {dispatch.return_time || "—"}</div></td>
              <td className="min-w-52 px-4 py-3"><div className="font-medium text-slate-900">{dispatch.vehicle_name}</div><div className="mt-1 text-slate-500">{dispatch.provider_name || "—"}{dispatch.license_plate ? ` · ${dispatch.license_plate}` : ""}</div><div>{dispatch.driver_name || "Chưa có tài xế"}{dispatch.driver_phone ? ` · ${dispatch.driver_phone}` : ""}</div></td>
              <td className="px-4 py-3"><div className="whitespace-pre-wrap">{dispatch.passenger_name || "—"}</div><div className="mt-1 text-slate-500">{dispatch.passenger_count} người</div></td>
              <td className="min-w-40 px-4 py-3"><div>{dispatch.pickup_location || "—"}</div><div className="mt-1">→ {dispatch.dropoff_location || "—"}</div></td>
              {company && <td className="min-w-56 px-4 py-3">
                {odometer != null ? <div>{info?.isFirstOfDay && info.isLastOfDay ? "Đầu / cuối ngày" : info?.isFirstOfDay ? "Đầu ngày" : info?.isLastOfDay ? "Cuối ngày" : "Đồng hồ"}: {odometer.toLocaleString("vi-VN")} km</div> : <div className="text-slate-500">{info?.isMissingRequiredOdo ? "Chưa chốt km" : "Chuyến giữa ngày"}</div>}
                {info?.warningMessage && <p className="mt-1 text-amber-800">{info.warningMessage.replace(/^⚠️\s*/, "")}</p>}
                {onQuickOdo && <button type="button" onClick={() => onQuickOdo(dispatch)} className={systemTextButton}>Chốt km / giờ về</button>}
              </td>}
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{company ? <><span>0</span><div className="text-slate-500">Khoán tháng</div></> : dispatch.cost.toLocaleString("vi-VN")}</td>
              <td className="min-w-36 max-w-60 whitespace-pre-wrap break-words px-4 py-3 text-slate-500">{dispatch.notes || "—"}</td>
            </tr>;
          })}
        </tbody>
        {!company && dispatches.length > 0 && <tfoot className="border-t border-slate-200 bg-slate-50 font-medium"><tr><th scope="row" colSpan={5} className="px-4 py-3 text-right">Tổng cước</th><td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{total.toLocaleString("vi-VN")}</td><td /></tr></tfoot>}
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{dispatches.length} chuyến xe</p>
  </div>;
}
