import type { Dispatch, SetStateAction } from "react";
import type { RouteType, VehicleDispatchCreatePayload, VendorRoute } from "../../types";
import { systemField } from "../../../../shared/components/systemStyles";
import { DispatchField, DispatchSelectField } from "./DispatchField";

interface DispatchPricingSectionProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: Dispatch<SetStateAction<VehicleDispatchCreatePayload>>;
  vendorRoutes: VendorRoute[];
  onRouteSelect: (value: string) => void;
  onCalculateCost: (providerId?: number | null, routeId?: number | null, routeType?: RouteType, km?: number, waiting?: number, seats?: string) => void;
}

export function DispatchPricingSection({ formData, setFormData, vendorRoutes, onRouteSelect, onCalculateCost }: DispatchPricingSectionProps) {
  return <section className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-3" aria-label="Bảng giá và tính cước">
    <h3 className="text-sm font-semibold text-slate-800">Bảng giá và tính cước hợp đồng</h3>
    <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
      <legend className="mb-2">Cách tính cước</legend>
      <label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="radio" name="route_type" checked={(formData.route_type || "FIXED_ROUTE") === "FIXED_ROUTE"}
        onChange={() => { setFormData(previous => ({ ...previous, route_type: "FIXED_ROUTE" })); onCalculateCost(formData.provider_id, formData.vendor_route_id, "FIXED_ROUTE"); }} />Tuyến cố định</label>
      <label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="radio" name="route_type" checked={formData.route_type === "KM_BASED"}
        onChange={() => { setFormData(previous => ({ ...previous, route_type: "KM_BASED" })); onCalculateCost(formData.provider_id, null, "KM_BASED", formData.distance_km); }} />Theo km</label>
    </fieldset>
    {(formData.route_type || "FIXED_ROUTE") === "FIXED_ROUTE" ? <DispatchSelectField label="Tuyến đường trong hợp đồng">
      <select value={formData.vendor_route_id || ""} onChange={event => onRouteSelect(event.target.value)} className={systemField}>
        <option value="">Chọn tuyến đường</option>
        {vendorRoutes.map(route => <option key={route.id} value={route.id}>[{route.purpose || "Chung"}] {route.pickup_location} → {route.dropoff_location} ({route.seat_type}: {route.fixed_price.toLocaleString("vi-VN")} đ)</option>)}
      </select>
    </DispatchSelectField> : <DispatchField label="Quãng đường (km)" type="number" min="0" step="0.1" value={formData.distance_km || 0}
      onChange={event => { const value = Number(event.target.value) || 0; setFormData({ ...formData, distance_km: value }); onCalculateCost(formData.provider_id, null, "KM_BASED", value); }} />}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <DispatchField label="Số giờ chờ" type="number" min="0" step="0.5" value={formData.waiting_hours || 0}
        onChange={event => { const value = Number(event.target.value) || 0; setFormData({ ...formData, waiting_hours: value }); onCalculateCost(formData.provider_id, formData.vendor_route_id, formData.route_type, formData.distance_km, value); }} />
      <div className="text-sm text-slate-700"><div className="mb-1">Giá gợi ý từ hợp đồng</div><output className="block py-2 font-semibold tabular-nums">{(formData.calculated_cost || 0).toLocaleString("vi-VN")} đ</output></div>
    </div>
    <p className="text-sm text-slate-500">Giá gợi ý lấy theo bảng giá hợp đồng. Có thể điều chỉnh cước thực tế trước khi lưu.</p>
  </section>;
}
