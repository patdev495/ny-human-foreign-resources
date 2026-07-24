import React, { useState, useEffect } from "react";
import type { DailyMealSessionSummary } from "../types";

interface LockMealSessionModalProps {
  date: string;
  sessionSummary: DailyMealSessionSummary;
  dayTypeName?: string;
  suggestedPrice?: number;
  onClose: () => void;
  onConfirm: (payload: {
    lock_date: string;
    meal_session: "BREAKFAST" | "LUNCH" | "DINNER";
    calculated_meal_count: number;
    final_meal_count: number;
    locked_price_per_meal: number;
    notes?: string;
  }) => Promise<void>;
}

export const LockMealSessionModal: React.FC<LockMealSessionModalProps> = ({
  date,
  sessionSummary,
  dayTypeName,
  suggestedPrice,
  onClose,
  onConfirm,
}) => {
  const sessionLabel =
    sessionSummary.meal_session === "BREAKFAST"
      ? "Bữa Sáng (Nước ngoài) 🍳"
      : sessionSummary.meal_session === "LUNCH"
      ? "Bữa Trưa (Lao công) ☀️"
      : "Bữa Tối (Nước ngoài) 🌙";

  const isAlreadyLocked = sessionSummary.is_locked;

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const isPastDate = date < getTodayStr();
  const [confirmedPast, setConfirmedPast] = useState<boolean>(false);
  const [confirmedRelock, setConfirmedRelock] = useState<boolean>(false);

  const [finalCount, setFinalCount] = useState<number>(
    sessionSummary.final_meal_count ?? sessionSummary.calculated_meal_count
  );
  const [lockedPrice, setLockedPrice] = useState<number>(
    sessionSummary.locked_price_per_meal ?? suggestedPrice ?? 30000
  );
  const [notes, setNotes] = useState<string>(sessionSummary.notes || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dragging logic
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only trigger drag if not clicking interactive elements like button or input
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("textarea")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastDate && !confirmedPast) {
      setErrorMsg("Vui lòng tích chọn ô xác nhận đồng ý điều chỉnh ngày trong quá khứ bên dưới.");
      return;
    }
    if (!isPastDate && isAlreadyLocked && !confirmedRelock) {
      setErrorMsg("Vui lòng tích chọn ô xác nhận đồng ý chốt lại bữa ăn đã từng chốt trước đó.");
      return;
    }
    if (finalCount < 0) {
      setErrorMsg("Số suất ăn không thể nhỏ hơn 0");
      return;
    }
    if (lockedPrice <= 0) {
      setErrorMsg("Đơn giá bữa ăn phải lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirm({
        lock_date: date,
        meal_session: sessionSummary.meal_session,
        calculated_meal_count: sessionSummary.calculated_meal_count,
        final_meal_count: finalCount,
        locked_price_per_meal: lockedPrice,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể chốt suất ăn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const delta = finalCount - sessionSummary.calculated_meal_count;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden">
      <div
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-shadow"
      >
        {/* Draggable Modal Header */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0"
          title="Kéo rê thanh tiêu đề này để di chuyển cửa sổ"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="text-xl">{isAlreadyLocked ? "✏️" : "🔒"}</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {isAlreadyLocked ? "Cập nhật Chốt Suất ăn" : "Chốt Suất ăn"} {sessionLabel}
              </h2>
              <p className="text-amber-100 text-xs mt-0.5 font-medium">
                Ngày <strong>{date}</strong> — {dayTypeName || "Ngày bình thường"} <span className="opacity-75">✋ (Kéo di chuyển)</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-100 hover:text-white hover:bg-amber-700/50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-70px)]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Stat summary */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-medium">Loại ngày áp dụng:</span>
              <span className="font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200">
                🏷️ {dayTypeName || "Ngày bình thường"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-medium">Số suất tính toán tự động:</span>
              <span className="font-bold text-amber-900 text-sm">
                {sessionSummary.calculated_meal_count} suất
              </span>
            </div>
          </div>

          {/* Final Count Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số suất thực tế chốt báo Nhà bếp <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={finalCount}
              onChange={(e) => setFinalCount(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              required
            />
            {delta !== 0 && (
              <p className={`text-xs font-bold mt-1 ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {delta > 0 ? `▲ Điều chỉnh tăng +${delta} suất` : `▼ Điều chỉnh giảm ${delta} suất`}
              </p>
            )}
          </div>

          {/* Locked Price Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đơn giá chốt (VNĐ / suất) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1000"
              min="0"
              value={lockedPrice}
              onChange={(e) => setLockedPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              required
            />
            <p className="text-slate-400 text-[11px] mt-1">
              Thành tiền đóng băng: <strong className="text-slate-700">{(finalCount * lockedPrice).toLocaleString()} VNĐ</strong>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú lý do điều chỉnh (nếu có)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: +1 suất do nhân sự Khách sạn ăn đột xuất, hoặc ông X đi công tác..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
            />
          </div>

          {/* Prioritized Warnings & Confirmations */}
          {isPastDate ? (
            /* 🔴 ƯU TIÊN 1 (Cao nhất): Cảnh báo Ngày trong Quá khứ */
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <span>⚠️ CẢNH BÁO: ĐANG CHỐT NGÀY TRONG QUÁ KHỨ</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Ngày bạn chọn (<strong>{date}</strong>) trước ngày hôm nay (<strong>{getTodayStr()}</strong>). Thao tác này sẽ ghi đè dữ liệu chốt suất ăn đối soát của ngày đã qua.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-bold text-rose-900 bg-white p-2 rounded-lg border border-rose-200 hover:bg-rose-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedPast}
                  onChange={(e) => setConfirmedPast(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
                <span>Tôi xác nhận đồng ý điều chỉnh ngày trong quá khứ</span>
              </label>
            </div>
          ) : isAlreadyLocked ? (
            /* 🟡 ƯU TIÊN 2 (Thấp hơn): Cảnh báo Chốt lại bữa ăn đã chốt */
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <span>⚠️ XÁC NHẬN CẬP NHẬT: BỮA ĂN NÀY ĐÃ ĐƯỢC CHỐT TRƯỚC ĐÓ</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {sessionLabel} ngày <strong>{date}</strong> đã được chốt chính thức 1 lần trước đó. Thao tác này sẽ cập nhật lại số suất ăn và đơn giá chốt mới.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-bold text-amber-900 bg-white p-2 rounded-lg border border-amber-200 hover:bg-amber-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedRelock}
                  onChange={(e) => setConfirmedRelock(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span>Tôi xác nhận đồng ý chốt lại và cập nhật dữ liệu mới</span>
              </label>
            </div>
          ) : null}

          {/* Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
            💡 <strong>Lưu ý:</strong> Bạn có thể chốt hoặc điều chỉnh cập nhật lại số suất ăn và đơn giá bất cứ lúc nào. Dữ liệu mới nhất sẽ được cập nhật để đối soát hóa đơn với nhà bếp.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting
                ? "Đang lưu..."
                : isAlreadyLocked
                ? "🔄 Cập Nhật Chốt Suất Ăn"
                : "🔒 Xác Nhận Chốt Suất Ăn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
