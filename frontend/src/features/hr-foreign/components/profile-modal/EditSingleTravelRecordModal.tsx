import React, { useState, useEffect } from "react";
import type { TravelRecord } from "../../types";
import { updateTravelRecord } from "../../api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  travelRecord: TravelRecord | null;
  onSuccess: () => void;
}

export const EditSingleTravelRecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employeeId,
  travelRecord,
  onSuccess,
}) => {
  const [entryDate, setEntryDate] = useState("");
  const [expectedExitDate, setExpectedExitDate] = useState("");
  const [actualExitDate, setActualExitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && travelRecord) {
      setError(null);
      setSaving(false);
      setEntryDate(travelRecord.entry_date || "");
      setExpectedExitDate(travelRecord.expected_exit_date || "");
      setActualExitDate(travelRecord.actual_exit_date || "");
      setNotes(travelRecord.notes || "");
    }
  }, [isOpen, travelRecord]);

  if (!isOpen || !travelRecord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      if (entryDate && entryDate > todayStr) {
        throw new Error("Ngày thực tế đến VN không được chọn ngày tương lai.");
      }
      if (actualExitDate && actualExitDate > todayStr) {
        throw new Error("Ngày thực tế đã về nước không được chọn ngày tương lai.");
      }
      if (entryDate && actualExitDate && actualExitDate < entryDate) {
        throw new Error(`Ngày thực tế đã về nước (${actualExitDate}) không thể nhỏ hơn ngày đến (${entryDate}).`);
      }

      await updateTravelRecord(employeeId, travelRecord.id, {
        entry_date: entryDate || undefined,
        expected_exit_date: expectedExitDate || undefined,
        actual_exit_date: actualExitDate || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu đợt lưu trú");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-600/30 bg-gradient-to-r from-sky-700 to-blue-800 text-white flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              ✏️ Cập nhật Đợt Lưu Trú / Di Chuyển
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Chỉnh sửa chi tiết mốc thời gian ngày đến & ngày về của đợt di chuyển
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {!travelRecord.entry_date && travelRecord.actual_exit_date && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] flex items-center gap-2 font-medium">
              <span>⚠️ Đợt này đang thiếu Ngày đến VN. Vui lòng bổ sung để chính xác hóa số ngày lưu trú.</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              📅 Ngày thực tế đến Việt Nam
            </label>
            <input
              type="date"
              value={entryDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium bg-amber-50/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                ⏳ Ngày dự kiến về
              </label>
              <input
                type="date"
                value={expectedExitDate}
                onChange={(e) => setExpectedExitDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                ✈️ Ngày thực tế đã về
              </label>
              <input
                type="date"
                value={actualExitDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setActualExitDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Ghi chú đợt di chuyển</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú về đợt di chuyển..."
              className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
