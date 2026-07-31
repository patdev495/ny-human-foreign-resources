import React from "react";
import type { MonthlyVehicleContract, Vehicle } from "../../types";

interface Props {
  mainInnovaContract: MonthlyVehicleContract;
  innovaContracts: MonthlyVehicleContract[];
  innovaVehicles: Vehicle[];
  onEditContract: (contract: MonthlyVehicleContract, linkedIds: number[]) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onViewPdf: (title: string, docKey: string) => void;
}

export const MonthlyInnovaContractCard: React.FC<Props> = ({
  mainInnovaContract,
  innovaContracts,
  innovaVehicles,
  onEditContract,
  onEditVehicle,
  onViewPdf,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Package Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <h3 className="text-lg font-bold">Gói Thuê Khoán 2 Xe 7 Chỗ (Toyota Innova)</h3>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Đơn vị vận tải Đức Anh • Phục vụ di chuyển Ban Giám đốc & Chuyên gia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewPdf("Hợp Đồng Thuê Xe 7 Chỗ (Đức Anh)", "HD_7seat_DucAnh")}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-lg text-xs transition-colors backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📄</span> Xem PDF Hợp Đồng
          </button>
          <button
            onClick={() => onEditContract(mainInnovaContract, innovaContracts.map((c) => c.id))}
            className="px-3 py-1.5 bg-white text-blue-900 font-bold rounded-lg text-xs hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚙️</span> Cấu Hình Bảng Giá
          </button>
        </div>
      </div>

      {/* Package Body: Rate Details */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cost & Allowance */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Giá Thuê Khoán Trọn Gói:</span>
            <span className="text-base font-extrabold text-blue-700 font-mono">
              {mainInnovaContract.base_monthly_cost.toLocaleString("vi-VN")} đ/tháng/xe
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Hạn mức Km chuẩn:</span>
            <span className="font-bold text-slate-800 font-mono">
              {mainInnovaContract.km_allowance.toLocaleString("vi-VN")} km/tháng
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Đơn giá km phụ trội:</span>
            <span className="font-bold text-rose-600 font-mono">
              {mainInnovaContract.excess_km_rate.toLocaleString("vi-VN")} đ/km
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Giờ làm việc chuẩn (T2 - T7):</span>
            <span className="font-bold text-slate-800 font-mono">
              {mainInnovaContract.standard_start_time} - {mainInnovaContract.standard_end_time}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Giờ làm việc chuẩn (Chủ nhật):</span>
            <span className="font-bold text-slate-800 font-mono">
              {mainInnovaContract.sunday_standard_start_time || "07:30"} - {mainInnovaContract.sunday_standard_end_time || "18:00"}
            </span>
          </div>
        </div>

        {/* Overtime & Rules */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
            Quy tắc Tăng ca & Ngày Lễ / Chủ Nhật:
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-100 flex justify-between">
              <span className="text-slate-700">Tăng ca ca tối (18h00 - 22h00):</span>
              <span className="font-bold text-blue-900 font-mono">Phụ cấp cố định 100.000 đ</span>
            </div>

            <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 flex justify-between">
              <span className="text-slate-700">Tăng ca ngoài khung (Trước 7h & sau 22h):</span>
              <span className="font-bold text-amber-900 font-mono">
                {mainInnovaContract.overtime_rate_weekday.toLocaleString("vi-VN")} đ/giờ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Mức ngày Chủ nhật</span>
                <span className="font-bold text-slate-800 font-mono text-xs">
                  {mainInnovaContract.sunday_daily_rate.toLocaleString("vi-VN")} đ/ngày
                </span>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Mức ngày Tết / Lễ</span>
                <span className="font-bold text-slate-800 font-mono text-xs">
                  {mainInnovaContract.holiday_daily_rate.toLocaleString("vi-VN")} đ/ngày
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Vehicles Footer */}
      <div className="p-4 bg-slate-50/90 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>🚗</span> Xe & Lái xe áp dụng gói này ({innovaVehicles.length} xe):
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {innovaVehicles.map((v) => (
            <div
              key={v.id}
              className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between gap-2 text-xs shadow-2xs hover:border-blue-300 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="font-extrabold text-blue-900 font-mono text-sm">
                  {v.license_plate || "Chưa có BS"}
                </div>
                <div className="text-slate-700">
                  Lái xe: <span className="font-bold text-slate-900">{v.driver_name || v.name}</span>
                </div>
                {v.driver_phone && (
                  <div className="text-slate-500 font-mono text-[11px]">📞 {v.driver_phone}</div>
                )}
              </div>

              <button
                onClick={() => onEditVehicle(v)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                ✏️ Sửa Thông Tin
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
