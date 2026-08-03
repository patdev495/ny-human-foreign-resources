import React from "react";
import type { VehicleDispatchCreatePayload } from "../../types";

interface DispatchOdometerSectionProps {
  formData: VehicleDispatchCreatePayload;
  setFormData: React.Dispatch<React.SetStateAction<VehicleDispatchCreatePayload>>;
}

export const DispatchOdometerSection: React.FC<DispatchOdometerSectionProps> = ({
  formData,
  setFormData,
}) => {
  const currentOdo = formData.odometer_km ?? formData.start_km ?? formData.end_km;

  return (
    <div className="border border-blue-200 bg-sky-50/50 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
          <span>📟</span> Thông Tin Đồng Hồ & Giờ Về (Xe Công Ty Đức Anh)
        </span>
        {currentOdo !== undefined && currentOdo !== null && (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
            Đồng hồ: {currentOdo.toLocaleString("vi-VN")} KM
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Số KM hiển thị trên đồng hồ xe
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.odometer_km ?? formData.start_km ?? ""}
            onChange={(e) => {
              const val = e.target.value !== "" ? parseFloat(e.target.value) : undefined;
              setFormData((prev) => ({
                ...prev,
                odometer_km: val,
                start_km: val,
              }));
            }}
            placeholder="VD: 45200 (Bổ sung sau được)..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Giờ kết thúc chuyến (Giờ về)
          </label>
          <input
            type="time"
            value={formData.return_time ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({
                ...prev,
                return_time: val || undefined,
              }));
            }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
        💡 <strong>Quy tắc tính tăng ca hợp đồng Đức Anh:</strong><br />
        • <strong>Chuyến đầu ngày</strong>: Nhập số đồng hồ đầu & Giờ đón (VD: 07:00).<br />
        • <strong>Chuyến cuối ngày</strong>: Nhập số đồng hồ cuối & Giờ về (VD: 19:30).<br />
        • Tăng ca ngoài khung giờ tiêu chuẩn (07:00 ➔ 18:00) sẽ được hệ thống tính tự động!
      </div>
    </div>
  );
};
