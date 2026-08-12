import React from "react";
import type { VehicleDispatchCreatePayload } from "../../types";

interface DispatchVehicleDetailsProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: React.Dispatch<React.SetStateAction<VehicleDispatchCreatePayload>>;
}

export const DispatchVehicleDetails: React.FC<DispatchVehicleDetailsProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Tên Xe / Mô tả phương tiện <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.vehicle_name}
          onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
          placeholder="VD: Xe 7 chỗ (Bình An), Chú Ngọc..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Tài xế, Biển số & SĐT</label>
        <div className="grid grid-cols-3 gap-1.5">
          <input
            type="text"
            value={formData.driver_name || ""}
            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            placeholder="Tài xế"
            className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
          />
          <input
            type="text"
            value={formData.license_plate || ""}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            placeholder="Biển số"
            className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
          />
          <input
            type="text"
            value={formData.driver_phone || ""}
            onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
            placeholder="SĐT tài xế"
            className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none font-mono"
          />
        </div>
      </div>
    </div>
  );
};
