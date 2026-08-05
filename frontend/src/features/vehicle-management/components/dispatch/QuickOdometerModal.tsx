import React, { useState, useEffect } from "react";
import { updateDispatch } from "../../api";
import type { VehicleDispatch } from "../../types";

interface QuickOdometerModalProps {
  isOpen: boolean;
  dispatch: VehicleDispatch | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickOdometerModal: React.FC<QuickOdometerModalProps> = ({
  isOpen,
  dispatch,
  onClose,
  onSuccess,
}) => {
  const [odometerKm, setOdometerKm] = useState<string>("");
  const [returnTime, setReturnTime] = useState<string>("");
  const [tollFee, setTollFee] = useState<string>("");
  const [mealCount, setMealCount] = useState<string>("");
  const [overnightCount, setOvernightCount] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (dispatch) {
      const odo = dispatch.odometer_km ?? dispatch.start_km ?? dispatch.end_km;
      setOdometerKm(odo !== undefined && odo !== null ? odo.toString() : "");
      setReturnTime(dispatch.return_time || "");
      setTollFee(dispatch.toll_fee ? dispatch.toll_fee.toString() : "0");
      setMealCount(dispatch.meal_count ? dispatch.meal_count.toString() : "0");
      setOvernightCount(dispatch.overnight_count ? dispatch.overnight_count.toString() : "0");
    }
  }, [dispatch]);

  if (!isOpen || !dispatch) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const val = odometerKm !== "" ? parseFloat(odometerKm) : undefined;

      await updateDispatch(dispatch.id, {
        dispatch_date: dispatch.dispatch_date,
        provider_id: dispatch.provider_id || undefined,
        provider_name: dispatch.provider_name || "",
        vehicle_id: dispatch.vehicle_id || undefined,
        vehicle_name: dispatch.vehicle_name,
        ownership_group: dispatch.ownership_group,
        driver_name: dispatch.driver_name || "",
        license_plate: dispatch.license_plate || "",
        driver_phone: dispatch.driver_phone || "",
        pickup_location: dispatch.pickup_location || "",
        dropoff_location: dispatch.dropoff_location || "",
        pickup_time: dispatch.pickup_time || "",
        return_time: returnTime || undefined,
        passenger_name: dispatch.passenger_name || "",
        passenger_count: dispatch.passenger_count || 1,
        odometer_km: val,
        start_km: val, // Sync for daily start Odo
        end_km: val,   // Sync for daily end Odo
        vendor_route_id: dispatch.vendor_route_id || undefined,
        route_type: dispatch.route_type || "FIXED_ROUTE",
        distance_km: dispatch.distance_km || 0,
        waiting_hours: dispatch.waiting_hours || 0,
        calculated_cost: dispatch.calculated_cost || 0,
        cost: dispatch.cost || 0,
        toll_fee: tollFee !== "" ? parseFloat(tollFee) : 0,
        meal_count: mealCount !== "" ? parseInt(mealCount, 10) : 0,
        overnight_count: overnightCount !== "" ? parseInt(overnightCount, 10) : 0,
        notes: dispatch.notes || "",
      });


      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Lỗi khi lưu thông tin chuyến xe: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>📟</span> Cập Nhật Số Đồng Hồ & Giờ Về (Xe Đức Anh)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-sky-50 p-3 rounded-xl border border-sky-200/80 text-xs text-sky-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>🚘</span> {dispatch.vehicle_name}
            </div>
            <div>
              <strong>Ngày điều xe:</strong> {dispatch.dispatch_date} {dispatch.pickup_time ? `(🕒 Giờ đón: ${dispatch.pickup_time})` : ""}
            </div>
            <div>
              <strong>Lộ trình:</strong> {dispatch.pickup_location || "—"} ➔ {dispatch.dropoff_location || "—"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số KM trên đồng hồ xe
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                placeholder="VD: 45200..."
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giờ kết thúc chuyến (Giờ về)
              </label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Vé xe / Cầu đường (đ)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={tollFee}
                onChange={(e) => setTollFee(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Số bữa ăn ngoài
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={mealCount}
                onChange={(e) => setMealCount(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Số đêm qua đêm
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={overnightCount}
                onChange={(e) => setOvernightCount(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>


          <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>Quy tắc tính tăng ca hợp đồng Đức Anh:</strong><br />
            • <strong>Chuyến đầu ngày</strong>: Bắt buộc có <strong>Giờ đón</strong> & số đồng hồ đầu.<br />
            • <strong>Chuyến cuối ngày</strong>: Bắt buộc có <strong>Giờ về</strong> & số đồng hồ cuối.<br />
            • Khung giờ hợp đồng: 07:00 ➔ 18:00 (CN: 07:30 ➔ 18:00). Ngoài giờ tính tăng ca tự động!
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu Cập Nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
