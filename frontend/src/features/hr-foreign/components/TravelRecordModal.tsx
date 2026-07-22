import React, { useState, useEffect } from "react";
import type { ForeignEmployee, Stay } from "../types";
import { recordEmployeeExit, createTravelRecord } from "../api";

interface TravelRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: ForeignEmployee;
  activeStay?: Stay | null;
  onSuccess: () => void;
}

export const TravelRecordModal: React.FC<TravelRecordModalProps> = ({
  isOpen,
  onClose,
  employee,
  activeStay,
  onSuccess,
}) => {
  const isInVietnam = Boolean(employee.entry_date && !employee.actual_exit_date);

  const [actualExitDate, setActualExitDate] = useState<string>("");
  const [entryDate, setEntryDate] = useState<string>("");
  const [expectedEntryDate, setExpectedEntryDate] = useState<string>("");
  const [expectedExitDate, setExpectedExitDate] = useState<string>("");
  const [actionType, setActionType] = useState<"CHECK_OUT" | "KEEP_ROOM_ABSENCE">(
    "CHECK_OUT"
  );
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      setActualExitDate("");
      setEntryDate("");
      setExpectedEntryDate(employee.expected_entry_date || "");
      setExpectedExitDate(employee.expected_exit_date || "");
      setActionType("CHECK_OUT");
      setNotes("");
    }
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isInVietnam) {
        if (!actualExitDate && !expectedExitDate && !expectedEntryDate) {
          throw new Error("Vui lòng nhập/cập nhật ít nhất 1 mốc ngày (Dự kiến về nước, Thực tế về nước, hoặc Dự kiến sang)");
        }
        await recordEmployeeExit(employee.id, {
          actual_exit_date: actualExitDate || undefined,
          expected_exit_date: expectedExitDate || undefined,
          expected_entry_date: expectedEntryDate || undefined,
          action_type: activeStay && actualExitDate ? actionType : "CHECK_OUT",
          notes: notes.trim() || undefined,
        });
      } else {
        if (!entryDate && !expectedEntryDate && !expectedExitDate) {
          throw new Error("Vui lòng nhập/cập nhật ít nhất 1 mốc ngày (Dự kiến sang, Thực tế đến VN, hoặc Dự kiến về)");
        }
        if (entryDate) {
          await createTravelRecord(employee.id, {
            entry_date: entryDate,
            expected_entry_date: expectedEntryDate || undefined,
            expected_exit_date: expectedExitDate || undefined,
            notes: notes.trim() || undefined,
          });
        } else {
          await recordEmployeeExit(employee.id, {
            expected_entry_date: expectedEntryDate || undefined,
            expected_exit_date: expectedExitDate || undefined,
            notes: notes.trim() || undefined,
          });
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              {isInVietnam ? (
                <>✈️ Cập nhật Ngày về / Nhập xuất cảnh — {employee.name_latin}</>
              ) : (
                <>📅 Cập nhật Ngày đến / Nhập xuất cảnh — {employee.name_latin}</>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isInVietnam
                ? "Cập nhật ngày dự kiến về nước, ngày thực tế đã về hoặc ngày dự kiến sang đợt tới"
                : "Cập nhật ngày dự kiến sang hoặc ghi nhận đợt đến Việt Nam mới"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {isInVietnam ? (
            /* CASE 1: Employee is currently IN VIETNAM */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    ⏳ Ngày dự kiến về nước
                  </label>
                  <input
                    type="date"
                    value={expectedExitDate}
                    onChange={(e) => setExpectedExitDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium bg-amber-50/40"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Điền/sửa để cảnh báo lịch về nước
                  </p>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    ✈️ Ngày thực tế đã về nước
                  </label>
                  <input
                    type="date"
                    value={actualExitDate}
                    onChange={(e) => setActualExitDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Chỉ điền khi nhân sự đã thực sự về nước
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  ⏳ Ngày dự kiến sang (Việt Nam) đợt tới
                </label>
                <input
                  type="date"
                  value={expectedEntryDate}
                  onChange={(e) => setExpectedEntryDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium bg-slate-50"
                />
              </div>

              {activeStay && (
                <div className={`space-y-2.5 pt-3 border-t border-slate-100 transition-opacity ${actualExitDate ? "opacity-100" : "opacity-60"}`}>
                  <label className="block text-slate-800 font-bold">
                    Xử lý Chỗ ở hiện tại ({activeStay.accommodation_type === "KTX" ? `KTX Phòng ${activeStay.room_number || ""}` : "Khách sạn"}):
                    {!actualExitDate && <span className="text-amber-700 text-[11px] font-normal ml-2">(Chỉ áp dụng khi chọn Ngày thực tế đã về nước)</span>}
                  </label>
                  
                  <div
                    onClick={() => actualExitDate && setActionType("CHECK_OUT")}
                    className={`p-3.5 rounded-xl border transition-all ${
                      actionType === "CHECK_OUT" && actualExitDate
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50/50"
                    } ${actualExitDate ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="action_type"
                        disabled={!actualExitDate}
                        checked={actionType === "CHECK_OUT"}
                        onChange={() => setActionType("CHECK_OUT")}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          🏠 Trả phòng & Trạng thái Đã về nước
                        </span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">
                          Chấm dứt lượt ở KTX hiện tại, giải phóng vị trí giường và ngừng tính cơm hoàn toàn.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => actualExitDate && setActionType("KEEP_ROOM_ABSENCE")}
                    className={`p-3.5 rounded-xl border transition-all ${
                      actionType === "KEEP_ROOM_ABSENCE" && actualExitDate
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50/50"
                    } ${actualExitDate ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="action_type"
                        disabled={!actualExitDate}
                        checked={actionType === "KEEP_ROOM_ABSENCE"}
                        onChange={() => setActionType("KEEP_ROOM_ABSENCE")}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          🛏️ Giữ phòng, chỉ báo vắng mặt (Không tính tiền cơm)
                        </span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">
                          Duy trì chỗ ở KTX để sẵn sàng cho lượt sang tới. Đánh dấu vắng mặt để không tính chi phí ăn.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CASE 2: Employee is ABROAD / NEW TRIP */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    ⏳ Ngày dự kiến sang (Việt Nam)
                  </label>
                  <input
                    type="date"
                    value={expectedEntryDate}
                    onChange={(e) => setExpectedEntryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium bg-amber-50/50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Điền/sửa ngày dự kiến sang sắp tới
                  </p>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    📅 Ngày thực tế đến VN (đợt mới)
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Điền khi nhân sự thực tế đã đến VN
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  ⏳ Ngày dự kiến về nước đợt tới
                </label>
                <input
                  type="date"
                  value={expectedExitDate}
                  onChange={(e) => setExpectedExitDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 font-medium mb-1">Ghi chú (Tùy chọn)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="VD: Cập nhật lịch di chuyển công tác..."
              className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              {saving ? "Đang lưu..." : "Lưu dữ liệu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
