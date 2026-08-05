import React from "react";

interface VehicleReportCardProps {
  vehicleSubTab: "DUC_ANH" | "OUTSOURCED";
  setVehicleSubTab: (tab: "DUC_ANH" | "OUTSOURCED") => void;
  vehicleStartDate: string;
  setVehicleStartDate: (date: string) => void;
  vehicleEndDate: string;
  setVehicleEndDate: (date: string) => void;
  loadingVehicle: boolean;
  handleDownloadVehicleReport: (providerType: "COMPANY_OWNED" | "OUTSOURCED") => void;
}

export const VehicleReportCard: React.FC<VehicleReportCardProps> = ({
  vehicleSubTab,
  setVehicleSubTab,
  vehicleStartDate,
  setVehicleStartDate,
  vehicleEndDate,
  setVehicleEndDate,
  loadingVehicle,
  handleDownloadVehicleReport,
}) => {
  return (
    <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚘</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Báo cáo Chi phí Thuê xe</h3>
            <p className="text-xs text-slate-500">
              Tổng hợp & xuất file đối chiếu cước phí sử dụng xe công ty khoán tháng và xe thuê ngoài
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-800">
          Điều xe / Kế toán
        </span>
      </div>

      {/* Sub-report Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setVehicleSubTab("DUC_ANH")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            vehicleSubTab === "DUC_ANH"
              ? "border-sky-500 bg-sky-50/80 shadow-xs ring-2 ring-sky-500/20"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span>🚗</span> 3 Xe Đức Anh (Khoán tháng)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
              Gói ZIP 3 file
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            2 xe Innova (`98A-369.00`, `98A-819.88`) & 1 xe tải 8 tấn (`99H-103.78`). Xuất file ZIP chứa 3 bảng đối chiếu riêng.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setVehicleSubTab("OUTSOURCED")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            vehicleSubTab === "OUTSOURCED"
              ? "border-sky-500 bg-sky-50/80 shadow-xs ring-2 ring-sky-500/20"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span>🚌</span> Xe Thuê ngoài (Nhà xe Bình An)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              File Excel (.xlsx)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Bảng kê tổng hợp các chuyến xe thuê ngoài phát sinh theo lộ trình, điểm đón/trả và đơn giá hợp đồng.
          </p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-200">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
            <span>📅</span> Từ ngày:
          </label>
          <input
            type="date"
            value={vehicleStartDate}
            onChange={(e) => setVehicleStartDate(e.target.value)}
            style={{ colorScheme: "light", color: "#0f172a" }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 [color-scheme:light]"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
            <span>📅</span> Đến ngày:
          </label>
          <input
            type="date"
            value={vehicleEndDate}
            onChange={(e) => setVehicleEndDate(e.target.value)}
            style={{ colorScheme: "light", color: "#0f172a" }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 [color-scheme:light]"
          />
        </div>
      </div>

      {vehicleSubTab === "DUC_ANH" ? (
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
          <li><strong>3 File Excel nén trong tệp ZIP:</strong> Tương ứng 3 xe khoán tháng của công ty Đức Anh.</li>
          <li><strong>Chuẩn hóa định dạng mẫu thực tế:</strong> Tiêu đề công ty, chi tiết công tơ mét từng ngày, tăng ca, tiền ăn, lưu đêm, phí cầu đường và công thức tính thành tiền.</li>
        </ul>
      ) : (
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
          <li><strong>Bảng kê chi tiết chuyến xe thuê ngoài:</strong> Thống kê toàn bộ nhật ký điều xe các nhà xe đối tác (Bình An...).</li>
          <li><strong>Đầy đủ thông tin đối chiếu:</strong> Lộ trình, khoảng cách, loại tuyến, giờ chờ và chi phí tính toán tự động.</li>
        </ul>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={() => handleDownloadVehicleReport(vehicleSubTab === "DUC_ANH" ? "COMPANY_OWNED" : "OUTSOURCED")}
          disabled={loadingVehicle}
          className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingVehicle ? (
            <span>⏳ Đang xử lý xuất báo cáo...</span>
          ) : (
            <>
              <span>📥</span>
              <span>
                {vehicleSubTab === "DUC_ANH"
                  ? "Tải Gói ZIP Báo cáo 3 Xe Đức Anh"
                  : "Tải Bảng kê Xe Thuê ngoài (Bình An)"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
