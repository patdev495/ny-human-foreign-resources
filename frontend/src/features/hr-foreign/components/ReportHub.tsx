import React, { useState } from "react";
import {
  downloadJanitorPayrollReport,
  downloadLegalProfileReport,
  downloadMealExpenseReport,
  downloadPresenceAccommodationReport,
  validateMealLocks,
} from "../api";
import type { UnclosedMealLockItem } from "../types";
import { UnclosedMealLocksModal } from "./report-hub/UnclosedMealLocksModal";
import type { NavTab } from "../../../components/Sidebar";

interface ReportHubProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

const REPORT_TABS: { key: NavTab; label: string; icon: string }[] = [
  { key: "EXPORT_LEGAL", label: "Hồ sơ & Pháp lý", icon: "📄" },
  { key: "EXPORT_PRESENCE", label: "Hiện diện chỗ ở KTX", icon: "🏫" },
  { key: "EXPORT_MEAL", label: "Chi phí Bữa ăn", icon: "🍱" },
  { key: "EXPORT_JANITOR", label: "Lương Tạp vụ", icon: "🧹" },
];

export const ReportHub: React.FC<ReportHubProps> = ({
  activeTab = "EXPORT_LEGAL",
  setActiveTab,
}) => {
  const today = new Date();
  const year = today.getFullYear();
  const monthStr = String(today.getMonth() + 1).padStart(2, "0");

  const firstDayOfMonth = `${year}-${monthStr}-01`;
  const day30OfMonth = `${year}-${monthStr}-30`;
  const todayStr = today.toISOString().split("T")[0];

  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [loadingLegal, setLoadingLegal] = useState(false);
  const [loadingPresence, setLoadingPresence] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingJanitor, setLoadingJanitor] = useState(false);
  const [mealStartDate, setMealStartDate] = useState(firstDayOfMonth);
  const [mealEndDate, setMealEndDate] = useState(todayStr);
  const [janitorStartDate, setJanitorStartDate] = useState(firstDayOfMonth);
  const [janitorEndDate, setJanitorEndDate] = useState(day30OfMonth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Missing meal locks state for warning modal
  const [missingLocks, setMissingLocks] = useState<UnclosedMealLockItem[] | null>(null);
  const [showLocksModal, setShowLocksModal] = useState(false);

  const handleDownloadJanitor = async () => {
    try {
      setLoadingJanitor(true);
      setErrorMessage(null);
      await downloadJanitorPayrollReport(janitorStartDate, janitorEndDate);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo chấm công & lương tạp vụ");
    } finally {
      setLoadingJanitor(false);
    }
  };

  const handleDownloadLegal = async () => {
    try {
      setLoadingLegal(true);
      setErrorMessage(null);
      await downloadLegalProfileReport(includeAttachments);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo pháp lý");
    } finally {
      setLoadingLegal(false);
    }
  };

  const handleDownloadPresence = async () => {
    try {
      setLoadingPresence(true);
      setErrorMessage(null);
      await downloadPresenceAccommodationReport();
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo hiện diện chỗ ở");
    } finally {
      setLoadingPresence(false);
    }
  };

  const handleDownloadMeal = async () => {
    try {
      setLoadingMeal(true);
      setErrorMessage(null);
      setMissingLocks(null);

      // Pre-export validation
      const validationRes = await validateMealLocks(mealStartDate, mealEndDate);
      if (validationRes.missing_dates && validationRes.missing_dates.length > 0) {
        setMissingLocks(validationRes.missing_dates);
        setShowLocksModal(true);
        return;
      }

      await downloadMealExpenseReport(mealStartDate, mealEndDate);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo chi phí bữa ăn");
    } finally {
      setLoadingMeal(false);
    }
  };

  const currentTab = activeTab || "EXPORT_LEGAL";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📊</span>
            <h1 className="text-2xl font-bold text-slate-800">Trung tâm Xuất Báo cáo Excel</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp và xuất dữ liệu báo cáo chuẩn hóa theo từng bộ phận nghiệp vụ (HR, KTX, Kế toán).
          </p>
        </div>

        {/* Sub-report selector tabs */}
        {setActiveTab && (
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {REPORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === tab.key
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* REPORT VIEWS */}
      {/* VIEW 1: LEGAL REPORT */}
      {currentTab === "EXPORT_LEGAL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Báo cáo Hồ sơ Nhân viên & Pháp lý</h3>
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
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingLegal ? (
                <span>⏳ Đang đóng gói dữ liệu...</span>
              ) : (
                <>
                  <span>📥</span>
                  <span>{includeAttachments ? "Tải Gói ZIP (Excel + Giấy tờ đính kèm)" : "Tải File Excel Báo cáo Pháp lý"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: PRESENCE REPORT */}
      {currentTab === "EXPORT_PRESENCE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏫</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Báo cáo Hiện diện & Chỗ ở KTX / Khách sạn</h3>
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
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingPresence ? (
                <span>⏳ Đang khởi tạo báo cáo...</span>
              ) : (
                <>
                  <span>📥</span>
                  <span>Tải File Excel Báo cáo Chỗ ở</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: MEAL EXPENSE REPORT */}
      {currentTab === "EXPORT_MEAL" && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍱</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Báo cáo Chi phí Bữa ăn (NNN & Lao công)</h3>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
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
        <div className="bg-white rounded-xl border border-purple-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧹</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Báo cáo Chấm công & Lương Tạp vụ</h3>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
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

      <UnclosedMealLocksModal
        isOpen={showLocksModal}
        missingLocks={missingLocks}
        onClose={() => setShowLocksModal(false)}
      />
    </div>
  );
};
