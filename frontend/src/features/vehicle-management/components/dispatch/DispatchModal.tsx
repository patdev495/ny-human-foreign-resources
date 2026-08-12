import React, { useEffect, useState } from "react";
import { calculateCost, fetchProviders, fetchVendorRoutes } from "../../api";
import { DispatchOdometerSection } from "./DispatchOdometerSection";
import { DispatchPricingSection } from "./DispatchPricingSection";
import { DispatchVehicleDetails } from "./DispatchVehicleDetails";
import type {
  OwnershipGroup,
  RouteType,
  Vehicle,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
  VehicleProvider,
  VendorRoute,
} from "../../types";

interface DispatchModalProps {
  isOpen: boolean;
  editingDispatch: VehicleDispatch | null;
  formData: VehicleDispatchCreatePayload;
  setFormData: React.Dispatch<React.SetStateAction<VehicleDispatchCreatePayload>>;
  vehicles: Vehicle[];
  providers?: VehicleProvider[];
  onVehicleSelect: (vehicleIdStr: string) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  editingDispatch,
  formData,
  setFormData,
  vehicles,
  providers: parentProviders,
  onVehicleSelect,
  onSave,
  onClose,
}) => {
  const [internalProviders, setInternalProviders] = useState<VehicleProvider[]>([]);
  const [vendorRoutes, setVendorRoutes] = useState<VendorRoute[]>([]);
  const [seatType, setSeatType] = useState<string>("4 chỗ");

  const providers = parentProviders && parentProviders.length > 0 ? parentProviders : internalProviders;

  useEffect(() => {
    if (isOpen && (!parentProviders || parentProviders.length === 0)) {
      fetchProviders().then(setInternalProviders).catch(console.error);
    }
  }, [isOpen, parentProviders]);

  // Ensure default provider is set when modal opens or providers load
  useEffect(() => {
    if (isOpen && providers.length > 0 && !formData.provider_id) {
      const defaultP = providers.find((p) => p.name === "Bình An") || providers[0];
      setFormData((prev) => ({
        ...prev,
        provider_id: defaultP.id,
        provider_name: defaultP.name,
        ownership_group: defaultP.provider_type,
      }));
    }
  }, [isOpen, providers, formData.provider_id, setFormData]);

  useEffect(() => {
    if (formData.provider_id) {
      fetchVendorRoutes(formData.provider_id).then(setVendorRoutes).catch(console.error);
    } else {
      setVendorRoutes([]);
    }
  }, [formData.provider_id]);

  // Recalculate cost automatically when route selection, km, or waiting hours change
  const handleCalculateCost = async (
    pId?: number | null,
    vRouteId?: number | null,
    rType?: RouteType,
    km?: number,
    waiting?: number,
    seats?: string
  ) => {
    const targetProviderId = pId !== undefined ? pId : formData.provider_id;
    const targetRouteId = vRouteId !== undefined ? vRouteId : formData.vendor_route_id;
    const targetRouteType = rType !== undefined ? rType : (formData.route_type || "FIXED_ROUTE");
    const targetKm = km !== undefined ? km : (formData.distance_km || 0);
    const targetWaiting = waiting !== undefined ? waiting : (formData.waiting_hours || 0);
    const targetSeat = seats || seatType;

    try {
      const res = await calculateCost({
        provider_id: targetProviderId,
        vendor_route_id: targetRouteId,
        route_type: targetRouteType,
        seat_type: targetSeat,
        distance_km: targetKm,
        waiting_hours: targetWaiting,
      });
      setFormData((prev) => ({
        ...prev,
        calculated_cost: res.total_calculated_cost,
        cost: res.total_calculated_cost > 0 ? res.total_calculated_cost : prev.cost,
      }));
    } catch (err) {
      console.error("Lỗi tính phí tự động:", err);
    }
  };

  const handleProviderChange = (providerIdStr: string) => {
    const pId = providerIdStr ? parseInt(providerIdStr, 10) : undefined;
    const selectedP = providers.find((p) => p.id === pId);
    const og: OwnershipGroup = selectedP?.provider_type || "COMPANY_OWNED";

    const defaultVehicle = og === "COMPANY_OWNED"
      ? vehicles.find((v) => (pId ? v.provider_id === pId : true) || v.ownership_group === "COMPANY_OWNED")
      : undefined;

    setFormData((prev) => ({
      ...prev,
      provider_id: pId,
      provider_name: selectedP?.name || "",
      ownership_group: og,
      vendor_route_id: undefined,
      vehicle_id: defaultVehicle ? defaultVehicle.id : undefined,
      vehicle_name: defaultVehicle ? defaultVehicle.name : "",
      driver_name: defaultVehicle ? defaultVehicle.driver_name || "" : "",
      license_plate: defaultVehicle ? defaultVehicle.license_plate || "" : "",
      driver_phone: defaultVehicle ? defaultVehicle.driver_phone || "" : "",
    }));
    handleCalculateCost(pId, undefined);
  };

  const handleRouteSelect = (routeIdStr: string) => {
    if (!routeIdStr) {
      setFormData((prev) => ({ ...prev, vendor_route_id: undefined }));
      return;
    }
    const rId = parseInt(routeIdStr, 10);
    const selectedR = vendorRoutes.find((r) => r.id === rId);
    if (selectedR) {
      const activeProviderId = formData.provider_id || (providers.find((p) => p.name === "Bình An") || providers[0])?.id;
      setFormData((prev) => ({
        ...prev,
        vendor_route_id: selectedR.id,
        pickup_location: selectedR.pickup_location,
        dropoff_location: selectedR.dropoff_location,
        route_type: "FIXED_ROUTE",
        vehicle_name: prev.vehicle_name && prev.ownership_group === "COMPANY_OWNED"
          ? prev.vehicle_name
          : `Xe ${selectedR.seat_type} (${prev.provider_name || "Thuê ngoài"})`,
      }));
      setSeatType(selectedR.seat_type);
      handleCalculateCost(activeProviderId, selectedR.id, "FIXED_ROUTE", formData.distance_km, formData.waiting_hours, selectedR.seat_type);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (formData.provider_id) {
      const selectedP = providers.find((p) => p.id === formData.provider_id);
      if (selectedP) {
        if (v.provider_id) {
          return v.provider_id === selectedP.id;
        }
        return v.ownership_group === selectedP.provider_type;
      }
    }
    if (formData.ownership_group) {
      return v.ownership_group === formData.ownership_group;
    }
    return true;
  });

  const handleSwapLocations = () => {
    setFormData((prev) => ({
      ...prev,
      pickup_location: prev.dropoff_location,
      dropoff_location: prev.pickup_location,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <span>🚐</span> {editingDispatch ? "Chỉnh sửa Bản ghi Điều xe" : "Tạo Đơn Điều xe mới"}
        </h3>

        <form onSubmit={onSave} className="space-y-4">
          {/* Header Row: Date & Pickup Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày điều xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dispatch_date}
                onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giờ đón (Xuất phát)</label>
              <input
                type="time"
                value={formData.pickup_time || ""}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giờ về (Kết thúc chuyến)</label>
              <input
                type="time"
                value={formData.return_time || ""}
                onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Provider & Vehicle Selection */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhà xe / Đơn vị <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.provider_id || ""}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="">-- Chọn Nhà xe / Nhóm xe --</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.provider_type === "COMPANY_OWNED"
                      ? "🏢 Xe công ty (Đức Anh)"
                      : `🚕 Nhà xe ${p.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gợi ý từ Xe khả dụng</label>
              <select
                value={formData.vehicle_id || ""}
                onChange={(e) => onVehicleSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn xe khả dụng --</option>
                {filteredVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.ownership_group === "COMPANY_OWNED" ? "🏢" : "🚕"} {v.name}{" "}
                    {v.driver_name ? `(${v.driver_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DispatchVehicleDetails formData={formData} setFormData={setFormData} />

          {/* Pricing Logic or Odometer Section */}
          {formData.ownership_group === "COMPANY_OWNED" ? (
            <DispatchOdometerSection formData={formData} setFormData={setFormData} />
          ) : (
            <DispatchPricingSection
              formData={formData}
              setFormData={setFormData}
              vendorRoutes={vendorRoutes}
              onRouteSelect={handleRouteSelect}
              onCalculateCost={handleCalculateCost}
            />
          )}


          {/* Locations & Passenger */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Lộ trình di chuyển</span>
              <button
                type="button"
                onClick={handleSwapLocations}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-100/70 hover:bg-blue-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 border border-blue-200"
                title="Đảo vị trí Điểm đi và Điểm đến"
              >
                <span>🔄</span> Đảo chiều chuyến đi (Chiều về)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm đi (Pickup) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pickup_location || ""}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  placeholder="VD: KTX, Sân bay Nội Bài..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm đến (Dropoff) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dropoff_location || ""}
                  onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                  placeholder="VD: Nhà máy, Khách sạn..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hành khách / Đoàn công tác</label>
              <input
                type="text"
                value={formData.passenger_name || ""}
                onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                placeholder="VD: WANG LEI..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chi phí chốt thực tế (VNĐ) <span className="text-slate-400 font-normal">(Có thể sửa)</span>
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs font-bold text-emerald-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú chuyến đi</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhập ghi chú thêm..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {editingDispatch ? "Cập nhật" : "Lưu chuyến đi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

