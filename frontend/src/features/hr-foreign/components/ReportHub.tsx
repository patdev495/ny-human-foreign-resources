import React from "react";
import { useReportHub } from "../hooks/useReportHub";
import { UnclosedMealLocksModal } from "./report-hub/UnclosedMealLocksModal";
import { VehicleReportCard } from "./reports/VehicleReportCard";
import { TripDurationReportCard } from "./reports/TripDurationReportCard";
import type { NavTab } from "../../../components/Sidebar";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";
import {
  FileSpreadsheet,
  FileText,
  Building2,
  UtensilsCrossed,
  Sparkles,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";



interface ReportHubProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export const ReportHub: React.FC<ReportHubProps> = ({
  activeTab = "EXPORT_LEGAL",
}) => {
  const {
    includeAttachments,
    setIncludeAttachments,
    loadingLegal,
    loadingPresence,
    loadingMeal,
    loadingJanitor,
    loadingVehicle,
    loadingTripDuration,
    mealStartDate,
    setMealStartDate,
    mealEndDate,
    setMealEndDate,
    janitorStartDate,
    setJanitorStartDate,
    janitorEndDate,
    setJanitorEndDate,
    vehicleStartDate,
    setVehicleStartDate,
    vehicleEndDate,
    setVehicleEndDate,
    vehicleSubTab,
    setVehicleSubTab,
    tripStartDate,
    setTripStartDate,
    tripEndDate,
    setTripEndDate,
    selectedEmployeeId,
    setSelectedEmployeeId,
    employees,
    errorMessage,
    setErrorMessage,
    missingLocks,
    showLocksModal,
    setShowLocksModal,
    handleDownloadLegal,
    handleDownloadPresence,
    handleDownloadMeal,
    handleDownloadJanitor,
    handleDownloadVehicleReport,
    handleDownloadTripDuration,
  } = useReportHub();




  const currentTab = activeTab || "EXPORT_LEGAL";

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <ModuleHeader
        title="Trung tâm Xuất Báo cáo Excel"
        subtitle="Tổng hợp và xuất dữ liệu báo cáo chuẩn hóa theo từng phân hệ nghiệp vụ (HR, KTX, Bữa ăn, Lương, Xe)."
        icon={FileSpreadsheet}
        theme="rose"
      />

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* REPORT VIEWS */}
      {/* VIEW 1: LEGAL REPORT */}
      {currentTab === "EXPORT_LEGAL" && (
        <div className="modern-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo Hồ sơ Nhân viên & Pháp lý</h3>
                <p className="text-xs text-slate-500">Chuẩn hóa dữ liệu HR Master + Giấy tờ Visa, Tạm trú, GPLĐ, HĐLĐ</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
              HR / Pháp lý
            </span>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li><strong>Sheet 1 [Danh sách Nhân sự]:</strong> Đầy đủ thông tin Master + cảnh báo Đỏ/Vàng về thời hạn Visa, Tạm trú, GPLĐ, HĐLĐ.</li>
            <li><strong>Sheet 2 [Lịch sử Giấy tờ]:</strong> Nhật ký chi tiết tất cả các đợt gia hạn giấy tờ.</li>
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAttachments}
                onChange={(e) => setIncludeAttachments(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Tải trọn gói ZIP (kèm toàn bộ ảnh Scan Hộ chiếu/Visa/GPLĐ & file PDF)</span>
            </label>

            <button
              onClick={handleDownloadLegal}
              disabled={loadingLegal}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingLegal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang đóng gói dữ liệu...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>{includeAttachments ? "Tải Gói ZIP (Excel + Đính kèm)" : "Tải File Excel Báo cáo"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: PRESENCE REPORT */}
      {currentTab === "EXPORT_PRESENCE" && (
        <div className="modern-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo Hiện diện & Chỗ ở KTX / Khách sạn</h3>
                <p className="text-xs text-slate-500">Phân vùng sơ đồ chỗ ở, nhân sự chưa xếp chỗ & lịch trình về nước</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              Quản lý KTX / Hành chính
            </span>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li><strong>Sheet 1 [Sơ đồ KTX & Khách sạn]:</strong> Danh sách nhân sự đang ở VN và đã được phân phòng/giường.</li>
            <li><strong>Sheet 2 [Chưa xếp chỗ ở]:</strong> Cảnh báo các nhân sự đang ở VN nhưng chưa xếp phòng.</li>
            <li><strong>Sheet 3 [Đã về nước]:</strong> Danh sách nhân sự đã về nước kèm lịch trình đợt tới.</li>
          </ul>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadPresence}
              disabled={loadingPresence}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingPresence ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo báo cáo...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Tải File Excel Báo cáo Chỗ ở</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: MEAL EXPENSE REPORT */}
      {currentTab === "EXPORT_MEAL" && (
        <div className="modern-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo Chi phí Bữa ăn (NNN & Lao công)</h3>
                <p className="text-xs text-slate-500">Tổng hợp suất ăn & chi phí thực tế theo khoảng thời gian tùy chọn</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              Kế toán / Nhà bếp
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span>📅</span> Từ ngày:
              </label>
              <input
                type="date"
                value={mealStartDate}
                onChange={(e) => setMealStartDate(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a" }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span>📅</span> Đến ngày:
              </label>
              <input
                type="date"
                value={mealEndDate}
                onChange={(e) => setMealEndDate(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a" }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 [color-scheme:light]"
              />
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li><strong>Sheet 1 [NNN - Chi phí Bữa ăn]:</strong> Tổng hợp số ngày ở, ngày vắng, suất ăn & thành tiền từng Nhân viên nước ngoài.</li>
            <li><strong>Sheet 2 [Lao công - Theo ngày]:</strong> Chi tiết các bữa trưa chốt suất ăn thực tế cho khối Lao công.</li>
          </ul>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadMeal}
              disabled={loadingMeal}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingMeal ? (
                <span>⏳ Đang kiểm tra & tạo báo cáo...</span>
              ) : (
                <>
                  <span>📥</span>
                  <span>Tải Báo cáo Chi phí Bữa ăn</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: JANITOR PAYROLL REPORT */}
      {currentTab === "EXPORT_JANITOR" && (
        <div className="modern-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo Chấm công & Lương Tạp vụ</h3>
                <p className="text-xs text-slate-500">Bảng chấm công chi tiết theo chuỗi ngày & tính lương công thức Excel</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
              Kế toán Lương
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-xl border border-purple-200">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span>📅</span> Từ ngày:
              </label>
              <input
                type="date"
                value={janitorStartDate}
                onChange={(e) => setJanitorStartDate(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a" }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span>📅</span> Đến ngày:
              </label>
              <input
                type="date"
                value={janitorEndDate}
                onChange={(e) => setJanitorEndDate(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a" }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 [color-scheme:light]"
              />
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200">
            <li>Bảng chấm công tự động chuỗi ngày (ngày công N, ngày vắng X, nghỉ lễ).</li>
            <li>Tự động tổng hợp công thực tế (`COUNTIFS`) và tính lương tháng/ngày với công thức động Excel.</li>
          </ul>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadJanitor}
              disabled={loadingJanitor}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingJanitor ? (
                <span>⏳ Đang xuất báo cáo lương...</span>
              ) : (
                <>
                  <span>📥</span>
                  <span>Tải Báo cáo Chấm công & Lương Tạp vụ</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 5: VEHICLE RENTAL EXPENSE REPORT */}
      {currentTab === "EXPORT_VEHICLES" && (
        <VehicleReportCard
          vehicleSubTab={vehicleSubTab}
          setVehicleSubTab={setVehicleSubTab}
          vehicleStartDate={vehicleStartDate}
          setVehicleStartDate={setVehicleStartDate}
          vehicleEndDate={vehicleEndDate}
          setVehicleEndDate={setVehicleEndDate}
          loadingVehicle={loadingVehicle}
          handleDownloadVehicleReport={handleDownloadVehicleReport}
        />
      )}

      {/* VIEW 6: TRIP DURATION & VISITS REPORT */}
      {currentTab === "EXPORT_TRIP_DURATION" && (
        <TripDurationReportCard
          tripStartDate={tripStartDate}
          setTripStartDate={setTripStartDate}
          tripEndDate={tripEndDate}
          setTripEndDate={setTripEndDate}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          employees={employees}
          loadingTripDuration={loadingTripDuration}
          handleDownloadTripDuration={handleDownloadTripDuration}
        />
      )}






      <UnclosedMealLocksModal
        isOpen={showLocksModal}
        missingLocks={missingLocks}
        onClose={() => setShowLocksModal(false)}
      />
    </div>
  );
};
