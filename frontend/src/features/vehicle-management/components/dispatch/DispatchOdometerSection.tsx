import type { Dispatch, SetStateAction } from "react";
import type { VehicleDispatchCreatePayload } from "../../types";
import { DispatchField } from "./DispatchField";

interface DispatchOdometerSectionProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: Dispatch<SetStateAction<VehicleDispatchCreatePayload>>;
}

export function DispatchOdometerSection({ formData, setFormData }: DispatchOdometerSectionProps) {
  return <section className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-3" aria-label="Đồng hồ và giờ về xe công ty">
    <h3 className="text-sm font-semibold text-slate-800">Đồng hồ và giờ về · Xe công ty</h3>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <DispatchField label="Số km trên đồng hồ" type="number" min="0" step="0.1" value={formData.odometer_km ?? formData.start_km ?? ""}
        onChange={event => { const value = event.target.value === "" ? undefined : Number(event.target.value); setFormData(previous => ({ ...previous, odometer_km: value, start_km: value })); }} />
      <DispatchField label="Giờ về / kết thúc" type="time" value={formData.return_time || ""} onChange={event => setFormData({ ...formData, return_time: event.target.value || undefined })} />
    </div>
    <p className="text-sm text-slate-500">Có thể bổ sung sau. Ghi đồng hồ và giờ đón ở chuyến đầu ngày; ghi đồng hồ và giờ về ở chuyến cuối ngày. Tăng ca được tính theo hợp đồng của xe.</p>
  </section>;
}
