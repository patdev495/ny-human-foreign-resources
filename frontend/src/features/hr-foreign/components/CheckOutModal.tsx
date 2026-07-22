import React, { useState } from "react";
import { checkoutStay } from "../api";
import type { ResidentInfo } from "../types";

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetResident?: ResidentInfo | null;
  unitName?: string;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetResident,
  unitName,
}) => {
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetResident) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate) {
      setError("Vui lòng chọn ngày trả phòng");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await checkoutStay(targetResident.stay_id, endDate);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể thực hiện trả phòng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center text-rose-600">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Xác nhận thủ tục Trả phòng
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nhân viên:</span>
            <span className="font-bold text-slate-900">
              {targetResident.name_latin}{" "}
              {targetResident.name_chinese ? `(${targetResident.name_chinese})` : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số hộ chiếu:</span>
            <span className="font-mono text-slate-800">
              {targetResident.passport_number || "—"}
            </span>
          </div>
          {unitName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Chỗ ở hiện tại:</span>
              <span className="font-semibold text-indigo-700">{unitName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Ngày bắt đầu ở:</span>
            <span className="text-slate-700">{targetResident.start_date || "—"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ngày trả phòng <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận Trả phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
