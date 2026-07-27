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

export const ReportHub: React.FC = () => {
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
            Tổng hợp và xuất dữ liệu báo cáo chuẩn hóa theo từng bộ phận nghiệp vụ (HR, KTX, Kế toán, Đội xe).
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: Legal & Master Profile Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                Dành cho HR / Pháp lý
              </span>
              <span className="text-xs text-slate-400 font-mono">Format: .XLSX / .ZIP</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📄 Báo cáo Hồ sơ Nhân viên & Pháp lý
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Báo cáo Excel 2 Sheet chuẩn hóa dành cho HR:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li><strong>Sheet 1 [Danh sách Nhân sự]:</strong> Đầy đủ thông tin cá nhân Master + Visa, Tạm trú, GPLĐ, HĐLĐ mới nhất đang hiệu lực (tự động tô màu cảnh báo Đỏ/Vàng).</li>
              <li><strong>Sheet 2 [Lịch sử Giấy tờ]:</strong> Nhật ký chi tiết tất cả đợt gia hạn giấy tờ.</li>
            </ul>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Tải trọn gói ZIP (kèm toàn bộ ảnh Scan Hộ chiếu/Visa/GPLĐ & file PDF)</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleDownloadLegal}
            disabled={loadingLegal}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

        {/* CARD 2: Presence & Accommodation Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                Dành cho Quản lý KTX / Hành chính
              </span>
              <span className="text-xs text-slate-400 font-mono">Format: .XLSX</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🏫 Báo cáo Hiện diện & Chỗ ở KTX / Khách sạn
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Báo cáo Excel 3 Sheet phân vùng hiện trạng chỗ ở toàn bộ nhân sự:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li><strong>Sheet 1 [Sơ đồ KTX & Khách sạn]:</strong> Danh sách nhân sự đang ở VN và đã được xếp phòng/giường.</li>
              <li><strong>Sheet 2 [Chưa xếp chỗ ở]:</strong> Cảnh báo các nhân sự đang ở VN nhưng chưa phân phòng.</li>
              <li><strong>Sheet 3 [Đã về nước]:</strong> Danh sách nhân sự đã về nước kèm lịch trình đợt tới.</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadPresence}
            disabled={loadingPresence}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

        {/* CARD 3: Meal Expense Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                Dành cho Kế toán / Nhà bếp
              </span>
              <span className="text-xs text-slate-400 font-mono">Format: .XLSX</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🍱 Báo cáo Chi phí Bữa ăn (NNN & Lao công)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Báo cáo Excel 2 Sheet tổng hợp chi phí suất ăn theo khoảng thời gian:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li><strong>Sheet 1 [NNN - Chi phí Bữa ăn]:</strong> Tổng hợp số ngày ở, ngày vắng, suất ăn & thành tiền từng Nhân viên nước ngoài.</li>
              <li><strong>Sheet 2 [Lao công - Theo ngày]:</strong> Chi tiết các bữa trưa chốt suất ăn thực tế cho khối Lao công.</li>
            </ul>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Từ ngày:</label>
                <input
                  type="date"
                  value={mealStartDate}
                  onChange={(e) => setMealStartDate(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Đến ngày:</label>
                <input
                  type="date"
                  value={mealEndDate}
                  onChange={(e) => setMealEndDate(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadMeal}
            disabled={loadingMeal}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

        {/* CARD 4: Janitor Payroll Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                Dành cho Kế toán / Lương
              </span>
              <span className="text-xs text-slate-400 font-mono">Format: .XLSX</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🧹 Báo cáo Chấm công & Lương Tạp vụ
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Báo cáo Excel chấm công và bảng lương chi tiết cho khối Nhân viên Tạp vụ:
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li>Bảng chấm công theo chuỗi các ngày trong tháng (công N, vắng X, nghỉ lễ).</li>
              <li>Tổng hợp số ngày công thực tế (`COUNTIFS`) và tính lương tháng/ngày tự động.</li>
            </ul>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Từ ngày:</label>
                <input
                  type="date"
                  value={janitorStartDate}
                  onChange={(e) => setJanitorStartDate(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Đến ngày:</label>
                <input
                  type="date"
                  value={janitorEndDate}
                  onChange={(e) => setJanitorEndDate(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadJanitor}
            disabled={loadingJanitor}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

      <UnclosedMealLocksModal
        isOpen={showLocksModal}
        missingLocks={missingLocks}
        onClose={() => setShowLocksModal(false)}
      />
    </div>
  );
};
