import React from "react";
import {
  Truck,
  FileText,
  Settings2,
  Phone,
  Edit2,
  Clock,
  Calendar,
  ShieldCheck,
  Sparkles,
  Moon,
  Utensils,
} from "lucide-react";
import type { MonthlyVehicleContract, Vehicle } from "../../types";

interface Props {
  mainTruckContract: MonthlyVehicleContract;
  truckVehicles: Vehicle[];
  onEditContract: (contract: MonthlyVehicleContract, linkedIds: number[]) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onViewPdf: (title: string, docKey: string) => void;
}

export const MonthlyTruckContractCard: React.FC<Props> = ({
  mainTruckContract,
  truckVehicles,
  onEditContract,
  onEditVehicle,
  onViewPdf,
}) => {
  return (
    <div className="executive-card overflow-hidden">
      {/* Executive Package Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-white">
                Gói Thuê Khoán Xe Tải 8 Tấn (CNHTC 7.4 Tấn)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Sparkles className="h-2.5 w-2.5" />
                Vận tải & Logistics
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Đơn vị vận tải Đức Anh • Phục vụ chở nguyên vật liệu, thành phẩm & logistics nhà máy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onViewPdf("Hợp Đồng Thuê Xe Tải 8 Tấn (Đức Anh)", "HD_xetai_DucAnh")}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>Xem PDF Hợp Đồng</span>
          </button>
          <button
            type="button"
            onClick={() => onEditContract(mainTruckContract, [mainTruckContract.id])}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Cấu Hình Bảng Giá</span>
          </button>
        </div>
      </div>

      {/* Package Body: Rate Details */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
        {/* Cost & Allowance */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500">Giá Thuê Khoán Trọn Gói:</span>
            <span className="text-base font-extrabold text-emerald-700 mono-metric">
              {mainTruckContract.base_monthly_cost.toLocaleString("vi-VN")} đ/tháng
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Hạn mức Km chuẩn:</span>
            <span className="font-bold text-slate-900 mono-metric">
              {mainTruckContract.km_allowance.toLocaleString("vi-VN")} km/tháng
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Đơn giá km phụ trội:</span>
            <span className="font-bold text-rose-600 mono-metric">
              {mainTruckContract.excess_km_rate.toLocaleString("vi-VN")} đ/km
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Giờ làm việc chuẩn (T2 - T7):</span>
            <span className="font-bold text-slate-800 mono-metric flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{mainTruckContract.standard_start_time} - {mainTruckContract.standard_end_time}</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Giờ làm việc chuẩn (Chủ nhật):</span>
            <span className="font-bold text-slate-800 mono-metric flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{mainTruckContract.sunday_standard_start_time || "07:30"} - {mainTruckContract.sunday_standard_end_time || "18:00"}</span>
            </span>
          </div>
        </div>

        {/* Overtime & Rules */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-bold text-slate-700 pb-1.5 border-b border-slate-200/80 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Quy tắc Tăng ca, Ăn ngoài & Phụ phí đặc thù:</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 flex justify-between items-center">
              <span className="text-slate-700 font-medium">Tăng ca ngoài giờ (Trước 8h & sau 18h):</span>
              <span className="font-bold text-emerald-900 mono-metric">
                {mainTruckContract.overtime_rate_weekday.toLocaleString("vi-VN")} đ/giờ
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 flex justify-between items-center">
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <Utensils className="h-3 w-3 text-amber-600" />
                <span>Ăn ngoài khung giờ chuẩn:</span>
              </span>
              <span className="font-bold text-amber-900 mono-metric">
                {mainTruckContract.meal_allowance_fee.toLocaleString("vi-VN")} đ/bữa
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-0.5">
              <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">Chủ nhật</span>
                <span className="font-bold text-slate-800 mono-metric text-xs">
                  {mainTruckContract.sunday_daily_rate.toLocaleString("vi-VN")} đ/ng
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">Tết / Lễ</span>
                <span className="font-bold text-slate-800 mono-metric text-xs">
                  {mainTruckContract.holiday_daily_rate.toLocaleString("vi-VN")} đ/ng
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/70">
                <span className="text-purple-700 block text-[11px] flex items-center gap-1">
                  <Moon className="h-2.5 w-2.5" />
                  <span>Lưu đêm</span>
                </span>
                <span className="font-bold text-purple-900 mono-metric text-xs">
                  {mainTruckContract.overnight_fee.toLocaleString("vi-VN")} đ/đêm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Vehicles Footer */}
      <div className="p-4 bg-slate-50/90 border-t border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Phương tiện & Lái xe áp dụng ({truckVehicles.length} xe):</span>
          </span>
        </div>

        <div className="space-y-2">
          {truckVehicles.map((v) => (
            <div
              key={v.id}
              className="p-3 bg-white border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 mono-metric text-xs tracking-wide">
                  {v.license_plate || "Chưa có BS"}
                </span>
                <div className="text-slate-700">
                  Lái xe: <span className="font-bold text-slate-900">{v.driver_name || v.name}</span>
                  {v.driver_phone && (
                    <span className="ml-2 text-slate-500 mono-metric inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{v.driver_phone}</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditVehicle(v)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                <span>Sửa</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
