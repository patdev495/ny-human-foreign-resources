import type { Dispatch, SetStateAction } from "react";
import type { VehicleDispatchCreatePayload } from "../../types";
import { DispatchField } from "./DispatchField";

interface DispatchVehicleDetailsProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: Dispatch<SetStateAction<VehicleDispatchCreatePayload>>;
}

export function DispatchVehicleDetails({ formData, setFormData }: DispatchVehicleDetailsProps) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <DispatchField label="Tên xe / mô tả phương tiện" required value={formData.vehicle_name} onChange={event => setFormData({ ...formData, vehicle_name: event.target.value })} />
    <DispatchField label="Tài xế" value={formData.driver_name || ""} onChange={event => setFormData({ ...formData, driver_name: event.target.value })} />
    <DispatchField label="Biển số" value={formData.license_plate || ""} onChange={event => setFormData({ ...formData, license_plate: event.target.value })} />
    <DispatchField label="Số điện thoại tài xế" type="tel" value={formData.driver_phone || ""} onChange={event => setFormData({ ...formData, driver_phone: event.target.value })} />
  </div>;
}
