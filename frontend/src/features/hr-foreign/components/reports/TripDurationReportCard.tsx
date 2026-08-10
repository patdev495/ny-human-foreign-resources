import React from "react";
import type { ForeignEmployee } from "../../types";

interface TripDurationReportCardProps {
  tripStartDate: string;
  setTripStartDate: (date: string) => void;
  tripEndDate: string;
  setTripEndDate: (date: string) => void;
  selectedEmployeeId: number | null;
  setSelectedEmployeeId: (id: number | null) => void;
  employees: ForeignEmployee[];
  loadingTripDuration: boolean;
  handleDownloadTripDuration: () => void;
}

export const TripDurationReportCard: React.FC<TripDurationReportCardProps> = ({
  tripStartDate,
  setTripStartDate,
  tripEndDate,
  setTripEndDate,
  selectedEmployeeId,
  setSelectedEmployeeId,
  employees,
  loadingTripDuration,
  handleDownloadTripDuration,
}) => {
  return (
    <div className="bg-white rounded-xl border border-sky-200 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Báo cáo Đợt Lưu trú & Nhập xuất cảnh</h3>
            <p className="text-xs text-slate-500">
              Tổng hợp danh sách các lượt di chuyển, ngày đến VN, ngày về nước & số ngày lưu trú trong kỳ
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-800">
          HR / Pháp lý & Hành chính
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-200">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
            <span>📅</span> Từ ngày:
          </label>
          <input
            type="date"
            value={tripStartDate}
            onChange={(e) => setTripStartDate(e.target.value)}
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
            value={tripEndDate}
            onChange={(e) => setTripEndDate(e.target.value)}
            style={{ colorScheme: "light", color: "#0f172a" }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 [color-scheme:light]"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
            <span>👤</span> Nhân viên:
          </label>
          <select
            value={selectedEmployeeId ?? ""}
            onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="">-- Tất cả Nhân sự --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_code ? `[${emp.employee_code}] ` : ""}{emp.name_latin} {emp.name_chinese ? `(${emp.name_chinese})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
        <li><strong>Sheet 1 [Đợt Lưu Trú & Nhập Xuất Cảnh]:</strong> Chi tiết từng lượt di chuyển của nhân sự (Mã NV, Họ tên, Hộ chiếu, Bộ phận, Loại hình Cố định/Công tác, Chỗ ở hiện tại).</li>

        <li>Cột <strong>"Số ngày ở trong kỳ":</strong> Số ngày giao thoa thực tế giữa đợt sang và khoảng ngày lọc.</li>
        <li>Cột <strong>"Tổng số ngày đợt di chuyển":</strong> Tổng thời gian lưu trú trọn đợt nhập xuất cảnh đó.</li>
        <li>Tự động tổng hợp số ngày ở dòng cuối cùng bằng công thức Excel.</li>
      </ul>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleDownloadTripDuration}
          disabled={loadingTripDuration}
          className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingTripDuration ? (
            <span>⏳ Đang khởi tạo báo cáo đợt lưu trú...</span>
          ) : (
            <>
              <span>📥</span>
              <span>Tải Báo cáo Đợt Lưu trú & Nhập xuất cảnh</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
