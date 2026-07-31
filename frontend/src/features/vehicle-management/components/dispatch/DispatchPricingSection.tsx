import React from "react";
import type { RouteType, VehicleDispatchCreatePayload, VendorRoute } from "../../types";

interface DispatchPricingSectionProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: React.Dispatch<React.SetStateAction<VehicleDispatchCreatePayload>>;
  vendorRoutes: VendorRoute[];
  onRouteSelect: (routeIdStr: string) => void;
  onCalculateCost: (
    pId?: number | null,
    vRouteId?: number | null,
    rType?: RouteType,
    km?: number,
    waiting?: number,
    seats?: string
  ) => void;
}

export const DispatchPricingSection: React.FC<DispatchPricingSectionProps> = ({
  formData,
  setFormData,
  vendorRoutes,
  onRouteSelect,
  onCalculateCost,
}) => {
  return (
    <div className="border border-blue-200 bg-blue-50/40 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
          <span>🏷️</span> Bảng Giá & Tính Cước Hợp Đồng
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="route_type"
              checked={(formData.route_type || "FIXED_ROUTE") === "FIXED_ROUTE"}
              onChange={() => {
                setFormData((prev) => ({ ...prev, route_type: "FIXED_ROUTE" }));
                onCalculateCost(formData.provider_id, formData.vendor_route_id, "FIXED_ROUTE");
              }}
            />
            Tuyến cố định HĐ
          </label>
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="route_type"
              checked={formData.route_type === "KM_BASED"}
              onChange={() => {
                setFormData((prev) => ({ ...prev, route_type: "KM_BASED" }));
                onCalculateCost(formData.provider_id, undefined, "KM_BASED", formData.distance_km);
              }}
            />
            Chạy theo KM (14k/km)
          </label>
        </div>
      </div>

      {(formData.route_type || "FIXED_ROUTE") === "FIXED_ROUTE" ? (
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Chọn Tuyến đường có sẵn trong Hợp đồng
          </label>
          <select
            value={formData.vendor_route_id || ""}
            onChange={(e) => onRouteSelect(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Chọn tuyến đường từ bảng giá HĐ --</option>
            {vendorRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.purpose || "Chung"}] {r.pickup_location} ➔ {r.dropoff_location} ({r.seat_type}: {r.fixed_price.toLocaleString("vi-VN")}đ)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Kilomet (KM)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.distance_km || 0}
            onChange={(e) => {
              const km = parseFloat(e.target.value) || 0;
              setFormData({ ...formData, distance_km: km });
              onCalculateCost(formData.provider_id, undefined, "KM_BASED", km);
            }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Nhập số KM chạy thực tế..."
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Số giờ chờ (Phí chờ 30k/h)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.waiting_hours || 0}
            onChange={(e) => {
              const w = parseFloat(e.target.value) || 0;
              setFormData({ ...formData, waiting_hours: w });
              onCalculateCost(formData.provider_id, formData.vendor_route_id, formData.route_type, formData.distance_km, w);
            }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
            Giá gợi ý từ Hợp đồng
          </label>
          <div className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
            {(formData.calculated_cost || 0).toLocaleString("vi-VN")} đ
          </div>
        </div>
      </div>
    </div>
  );
};
