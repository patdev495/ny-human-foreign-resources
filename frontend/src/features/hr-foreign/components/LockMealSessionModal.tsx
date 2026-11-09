import React, { useState, useEffect } from "react";
import type { DailyMealEmployeeItem, DailyMealSessionSummary, MealSessionLock } from "../types";
import { fetchMealLockHistory } from "../api";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";
import { vietnamDate } from "./meal-forecast/vietnamDate";

interface LockMealSessionModalProps {
  date: string;
  sessionSummary: DailyMealSessionSummary;
  dayTypeName?: string;
  suggestedPrice?: number;
  employees: DailyMealEmployeeItem[];
  usesMealReports: boolean;
  cutoff: string;
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
  employees,
  usesMealReports,
  cutoff,
  onClose,
  onConfirm,
}) => {
  const sessionLabel =
    sessionSummary.meal_session === "BREAKFAST"
      ? "Bữa Sáng (Nước ngoài) "
      : sessionSummary.meal_session === "LUNCH"
      ? "Bữa Trưa (Tạp vụ) "
      : "Bữa Tối (Nước ngoài) ";

  const isAlreadyLocked = sessionSummary.is_locked;
  const isNewForeignLock = usesMealReports && sessionSummary.meal_session !== "LUNCH";
  const deadline = Date.parse(`${date}T${cutoff}:00+07:00`) - 24 * 60 * 60 * 1000;
  const [currentTime, setCurrentTime] = useState(Date.now);
  const isBeforeLockWindow = isNewForeignLock && currentTime < deadline;
  useEffect(() => {
    if (!isBeforeLockWindow) return;
    const delay = Math.min(Math.max(deadline - Date.now() + 1000, 1000), 2_147_483_647);
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [deadline, isBeforeLockWindow, currentTime]);
  const [history, setHistory] = useState<MealSessionLock[]>([]);
  useEffect(() => {
    if (isNewForeignLock && isAlreadyLocked) {
      void fetchMealLockHistory(date, sessionSummary.meal_session).then(setHistory).catch(() => setHistory([]));
    }
  }, [date, isAlreadyLocked, isNewForeignLock, sessionSummary.meal_session]);

  const today = vietnamDate();
  const isPastDate = date < today;
  const isSunday = new Date(date + "T00:00:00").getDay() === 0;
  const [confirmedPast, setConfirmedPast] = useState<boolean>(false);
  const [confirmedRelock, setConfirmedRelock] = useState<boolean>(false);
  const [confirmedSunday, setConfirmedSunday] = useState<boolean>(false);

  const [finalCount, setFinalCount] = useState<number>(
    sessionSummary.final_meal_count ?? sessionSummary.calculated_meal_count
  );
  const [lockedPrice, setLockedPrice] = useState<number>(
    isNewForeignLock ? (suggestedPrice ?? 30000) : (sessionSummary.locked_price_per_meal ?? suggestedPrice ?? 30000)
  );
  const [notes, setNotes] = useState<string>(isNewForeignLock && isAlreadyLocked ? "" : sessionSummary.notes || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isNewForeignLock && Date.now() < deadline) {
      setErrorMsg(`Chỉ được chốt từ ${cutoff} ngày hôm trước theo giờ Việt Nam.`);
      return;
    }
    if (isSunday && !confirmedSunday) {
      setErrorMsg(" Cảnh báo: Ngày được chọn chốt là Chủ Nhật (ngày Chủ Nhật thực tế không tính suất ăn). Vui lòng tích chọn ô xác nhận đồng ý bên dưới.");
      return;
    }
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
    if (isNewForeignLock && (isAlreadyLocked || finalCount !== sessionSummary.calculated_meal_count) && !notes.trim()) {
      setErrorMsg("Vui lòng nhập lý do khi điều chỉnh số suất hoặc chốt lại.");
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể chốt suất ăn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const delta = finalCount - sessionSummary.calculated_meal_count;

  return <SystemDialog isOpen onClose={onClose} title={`${isAlreadyLocked ? "Chốt lại" : "Chốt suất ăn"} · ${sessionLabel}`} wide>
    <p className="mb-4 text-sm text-slate-600">Ngày {date} · {dayTypeName || "Ngày bình thường"}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 font-medium">
               {errorMsg}
            </div>
          )}

          {/* Stat summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Loại ngày áp dụng:</span>
              <span className="font-semibold text-slate-900 px-2.5 py-0.5">
                 {dayTypeName || "Ngày bình thường"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Số suất tính toán tự động:</span>
              <span className="font-medium text-slate-900 text-sm">
                {sessionSummary.calculated_meal_count} suất
              </span>
            </div>
          </div>

          {/* Final Count Input */}
          {isBeforeLockWindow && <p role="alert" className="rounded-sm bg-rose-50 p-3 text-xs font-semibold text-rose-800">Chỉ được chốt từ {cutoff} ngày hôm trước theo giờ Việt Nam.</p>}
          {isNewForeignLock && <details className="rounded-sm border border-slate-200 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-slate-700">Xem chi tiết Báo cơm theo bữa</summary>
            <div className="mt-2 space-y-1">
              {employees.filter(employee => employee.accommodation_type === "KTX").map(employee => {
                const status = sessionSummary.meal_session === "BREAKFAST" ? employee.breakfast_report_status : employee.dinner_report_status;
                const label = status === "EATING" ? "Có ăn" : status === "NOT_EATING" ? "Không ăn" : status === "NOT_REPORTED" ? "Chưa báo cơm" : "Không đủ điều kiện";
                return <div key={employee.employee_id} className="flex justify-between gap-2 border-b border-slate-100 py-1"><span>{employee.name_latin} · {employee.location_name}</span><strong>{label}</strong></div>;
              })}
            </div>
          </details>}
          {history.length > 0 && <details className="rounded-sm border border-slate-200 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-slate-700">Lịch sử chốt ({history.length})</summary>
            <ol className="mt-2 space-y-1">{history.map(item => <li key={item.id}>{new Date(item.locked_at).toLocaleString("vi-VN")}: {item.final_meal_count} suất · {item.locked_price_per_meal.toLocaleString("vi-VN")}đ{item.notes ? ` · ${item.notes}` : ""}</li>)}</ol>
          </details>}
          <div>
            <label htmlFor="meal-final-count" className="block text-xs font-medium text-slate-700 mb-1">
              Số suất thực tế chốt báo Nhà bếp <span className="text-rose-500">*</span>
            </label>
            <input id="meal-final-count"
              type="number"
              min="0"
              value={finalCount}
              onChange={(e) => setFinalCount(parseInt(e.target.value) || 0)}
              className={systemField}
              required
            />
            {delta !== 0 && (
              <p className={`text-xs font-medium mt-1 ${delta > 0 ? "text-slate-700" : "text-rose-600"}`}>
                {delta > 0 ? `Điều chỉnh tăng +${delta} suất` : `Điều chỉnh giảm ${delta} suất`}
              </p>
            )}
          </div>

          {/* Locked Price Input */}
          <div>
            <label htmlFor="meal-lock-price" className="block text-xs font-medium text-slate-700 mb-1">
              {isNewForeignLock ? "Đơn giá theo cấu hình (VNĐ / suất)" : "Đơn giá chốt (VNĐ / suất)"}
              {!isNewForeignLock && <span className="text-rose-500">*</span>}
            </label>
            <input id="meal-lock-price"
              type="number"
              step="1000"
              min="0"
              value={lockedPrice}
              onChange={(e) => setLockedPrice(parseFloat(e.target.value) || 0)}
              readOnly={isNewForeignLock}
              className={systemField}
              required
            />
            <p className="text-slate-600 text-xs mt-1">
              Thành tiền đóng băng: <strong className="text-slate-700">{(finalCount * lockedPrice).toLocaleString()} VNĐ</strong>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="meal-lock-notes" className="block text-xs font-medium text-slate-700 mb-1">
              Lý do điều chỉnh {isNewForeignLock && (isAlreadyLocked || finalCount !== sessionSummary.calculated_meal_count) ? "*" : "(nếu có)"}
            </label>
            <textarea id="meal-lock-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: +1 suất do nhân sự Khách sạn ăn đột xuất, hoặc ông X đi công tác..."
              className={systemField}
            />
          </div>

          {/* Prioritized Warnings & Confirmations */}
          {isSunday && (
            <div className="bg-white border border-red-200 rounded-sm p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 font-medium text-xs">
                <span className="text-sm"></span>
                <span>Ngày được chọn là Chủ nhật</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Ngày <strong>{date}</strong> là <strong>Chủ Nhật</strong>. Theo quy định báo cáo thực tế, ngày Chủ Nhật mặc định <strong>không phục vụ suất ăn</strong> (trừ khi có sự kiện đột xuất).
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-medium text-rose-900 bg-white p-2 rounded-sm border border-rose-300 hover:bg-rose-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedSunday}
                  onChange={(e) => setConfirmedSunday(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
                <span>Tôi xác nhận đồng ý chốt suất ăn cho ngày Chủ Nhật này</span>
              </label>
            </div>
          )}

          {isPastDate ? (
            /*  ƯU TIÊN 1: Cảnh báo Ngày trong Quá khứ */
            <div className="bg-white border border-red-200 rounded-sm p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 font-medium text-xs">
                <span> Đang chốt ngày trong quá khứ</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Ngày bạn chọn (<strong>{date}</strong>) trước ngày hôm nay (<strong>{today}</strong>). Thao tác này sẽ ghi đè dữ liệu chốt suất ăn đối soát của ngày đã qua.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-medium text-rose-900 bg-white p-2 rounded-sm border border-rose-200 hover:bg-rose-100/50 transition-colors">
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
            /*  ƯU TIÊN 2: Cảnh báo Chốt lại bữa ăn đã chốt */
            <div className="bg-white border border-amber-200 rounded-sm p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                <span> Xác nhận chốt lại bữa ăn</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {sessionLabel} ngày <strong>{date}</strong> đã được chốt chính thức 1 lần trước đó. Thao tác này sẽ cập nhật lại số suất ăn và đơn giá chốt mới.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-medium text-slate-900 bg-white p-2 rounded-sm border border-amber-200 hover:bg-amber-100/50 transition-colors">
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
          <div className="bg-white border border-slate-200 rounded-sm p-3 text-xs text-slate-700 leading-relaxed">
             <strong>Lưu ý:</strong> Bản chốt mới nhất được dùng để đối soát chi phí. Mỗi lần chốt lại bữa Sáng/Tối được lưu trong lịch sử.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={systemSecondaryButton}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isBeforeLockWindow}
              className={systemPrimaryButton}
            >
              {isSubmitting
                ? "Đang lưu..."
                : isAlreadyLocked
                ? " Cập Nhật Chốt Suất Ăn"
                : " Xác Nhận Chốt Suất Ăn"}
            </button>
          </div>
        </form>
  </SystemDialog>;
};
