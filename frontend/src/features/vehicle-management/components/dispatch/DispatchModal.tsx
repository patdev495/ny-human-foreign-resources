import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Vehicle, VehicleDispatch, VehicleDispatchCreatePayload, VehicleProvider } from "../../types";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../../shared/components/systemStyles";
import { DispatchOdometerSection } from "./DispatchOdometerSection";
import { DispatchPricingSection } from "./DispatchPricingSection";
import { DispatchVehicleDetails } from "./DispatchVehicleDetails";
import { DispatchField, DispatchSelectField } from "./DispatchField";
import { useDispatchForm } from "./useDispatchForm";

interface DispatchModalProps {
  isOpen: boolean;
  editingDispatch: VehicleDispatch | null;
  formData: VehicleDispatchCreatePayload;
  setFormData: Dispatch<SetStateAction<VehicleDispatchCreatePayload>>;
  vehicles: Vehicle[];
  providers: VehicleProvider[];
  onVehicleSelect: (id: string) => void;
  onSave: (event: FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

export function DispatchModal({ isOpen, editingDispatch, formData, setFormData, vehicles, providers,
  onVehicleSelect, onSave, onClose, saving, error }: DispatchModalProps) {
  const form = useDispatchForm(isOpen, formData, setFormData, providers, vehicles);
  return <SystemDialog isOpen={isOpen} onClose={onClose} title={editingDispatch ? "Sửa chuyến điều xe" : "Thêm chuyến điều xe"} wide>
    <form onSubmit={onSave} className="space-y-4">
      <fieldset disabled={saving} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DispatchField label="Ngày điều xe" type="date" required value={formData.dispatch_date} onChange={event => setFormData({ ...formData, dispatch_date: event.target.value })} />
          <DispatchField label="Giờ đón / xuất phát" type="time" value={formData.pickup_time || ""} onChange={event => setFormData({ ...formData, pickup_time: event.target.value })} />
          {formData.ownership_group !== "COMPANY_OWNED" && <DispatchField label="Giờ về / kết thúc" type="time" value={formData.return_time || ""} onChange={event => setFormData({ ...formData, return_time: event.target.value })} />}
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
          <DispatchSelectField label="Nhà xe / đơn vị">
            <select value={formData.provider_id || ""} onChange={event => form.handleProviderChange(event.target.value)} className={systemField}>
              <option value="">Chọn nhà xe / đơn vị</option>
              {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name} ({provider.provider_type === "COMPANY_OWNED" ? "Xe công ty" : "Xe thuê ngoài"})</option>)}
            </select>
          </DispatchSelectField>
          <DispatchSelectField label="Chọn từ danh mục xe">
            <select value={formData.vehicle_id || ""} onChange={event => onVehicleSelect(event.target.value)} className={systemField}>
              <option value="">Chọn xe khả dụng</option>
              {form.filteredVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}{vehicle.driver_name ? ` (${vehicle.driver_name})` : ""}</option>)}
            </select>
          </DispatchSelectField>
        </div>
        <DispatchVehicleDetails formData={formData} setFormData={setFormData} />
        {formData.ownership_group === "COMPANY_OWNED" ? <DispatchOdometerSection formData={formData} setFormData={setFormData} /> : <>
          {form.routesLoading && <p role="status" className="text-sm text-slate-500">Đang tải bảng giá…</p>}
          {form.routesError && <div role="alert" className="text-sm text-red-700">{form.routesError} <button type="button" className={systemTextButton} onClick={form.retryRoutes}>Thử lại</button></div>}
          <DispatchPricingSection formData={formData} setFormData={setFormData} vendorRoutes={form.vendorRoutes} onRouteSelect={form.handleRouteSelect} onCalculateCost={form.handleCalculateCost} />
          {form.calculating && <p role="status" className="text-sm text-slate-500">Đang tính giá gợi ý…</p>}
          {form.pricingError && <div role="alert" className="text-sm text-red-700">{form.pricingError} <button type="button" onClick={() => void form.handleCalculateCost()} className={systemTextButton}>Thử tính lại</button></div>}
        </>}
        <div className="border-t border-slate-200 pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800">Lộ trình</h3>
            <button type="button" className={systemTextButton} onClick={() => setFormData(previous => ({ ...previous, pickup_location: previous.dropoff_location, dropoff_location: previous.pickup_location }))}>Đảo điểm đi / đến</button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DispatchField label="Điểm đi" required value={formData.pickup_location || ""} onChange={event => setFormData({ ...formData, pickup_location: event.target.value })} />
            <DispatchField label="Điểm đến" required value={formData.dropoff_location || ""} onChange={event => setFormData({ ...formData, dropoff_location: event.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DispatchField label="Hành khách / đoàn công tác" value={formData.passenger_name || ""} onChange={event => setFormData({ ...formData, passenger_name: event.target.value })} />
          <DispatchField label="Cước thực tế (đ)" type="number" min="0" step="10000" value={formData.cost} onChange={event => setFormData({ ...formData, cost: Number(event.target.value) || 0 })} />
        </div>
        <DispatchSelectField label="Ghi chú chuyến đi"><textarea rows={2} value={formData.notes || ""} onChange={event => setFormData({ ...formData, notes: event.target.value })} className={systemField} /></DispatchSelectField>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={onClose} disabled={saving} className={systemSecondaryButton}>Hủy</button>
        <button type="submit" disabled={saving || form.calculating} className={systemPrimaryButton}>{saving ? "Đang lưu…" : "Lưu chuyến"}</button>
      </div>
    </form>
  </SystemDialog>;
}
