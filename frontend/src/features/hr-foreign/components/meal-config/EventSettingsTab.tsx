import { systemField, systemPrimaryButton, systemTextButton } from "../../../../shared/components/systemStyles";
import React, { useState } from "react";
import type { EventDay, MealPriceConfig } from "../../types";
import {
  createEventDaysBatch,
  deleteEventDay,
  updateEventDay,
} from "../../api";

interface Props {
  eventDays: EventDay[];
  priceConfigs: MealPriceConfig[];
  onDataChange: () => void;
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export const EventSettingsTab: React.FC<Props> = ({
  eventDays,
  priceConfigs,
  onDataChange,
  setError,
  setSuccessMsg,
}) => {
  const [evStartDate, setEvStartDate] = useState<string>("");
  const [evEndDate, setEvEndDate] = useState<string>("");
  const [evSelectedDayType, setEvSelectedDayType] = useState<string>("PRESIDENT_VISIT");
  const [evNotes, setEvNotes] = useState<string>("");

  const [editingEvId, setEditingEvId] = useState<number | null>(null);
  const [editingEvDate, setEditingEvDate] = useState<string>("");
  const [editingEvType, setEditingEvType] = useState<string>("PRESIDENT_VISIT");
  const [editingEvNotes, setEditingEvNotes] = useState<string>("");

  const handleCreateEventDaysBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!evStartDate && !evEndDate) {
      setError("Vui lòng nhập 'Từ ngày' hoặc 'Đến ngày'");
      return;
    }

    try {
      const result = await createEventDaysBatch({
        start_date: evStartDate || undefined,
        end_date: evEndDate || undefined,
        event_type: evSelectedDayType,
        notes: evNotes.trim() || undefined,
      });

      const count = result.length;
      const isSingle = count === 1;
      setSuccessMsg(
        isSingle
          ? ` Đã đánh dấu ngày sự kiện đơn lẻ (${result[0].event_date}) thành công!`
          : ` Đã cài đặt sự kiện cho khoảng ${count} ngày (${result[0].event_date} ➔ ${
              result[count - 1].event_date
            })!`
      );

      setEvStartDate("");
      setEvEndDate("");
      setEvNotes("");
      onDataChange();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể cài đặt sự kiện");
    }
  };

  const handleStartEditEventDay = (ev: EventDay) => {
    setEditingEvId(ev.id);
    setEditingEvDate(ev.event_date);
    setEditingEvType(ev.event_type);
    setEditingEvNotes(ev.notes || "");
  };

  const handleCancelEditEventDay = () => {
    setEditingEvId(null);
  };

  const handleSaveEditEventDay = async (id: number) => {
    try {
      await updateEventDay(id, {
        event_date: editingEvDate,
        event_type: editingEvType,
        notes: editingEvNotes.trim() ? editingEvNotes.trim() : null,
      });
      setSuccessMsg(" Đã cập nhật ngày sự kiện thành công!");
      setEditingEvId(null);
      onDataChange();
    } catch (err: unknown) {
      alert(`Lỗi khi cập nhật ngày sự kiện: ${err instanceof Error ? err.message : "Không thể thực hiện thao tác."}`);
    }
  };

  const handleDeleteEventDay = async (id: number) => {
    if (!window.confirm("Xóa ngày sự kiện này?")) return;
    try {
      await deleteEventDay(id);
      setSuccessMsg(" Đã xóa ngày sự kiện!");
      onDataChange();
    } catch (err: unknown) {
      alert(`Lỗi khi xóa: ${err instanceof Error ? err.message : "Không thể thực hiện thao tác."}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-sm p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
           Cài đặt Sự kiện / Ngày đặc biệt
        </h3>
        <form onSubmit={handleCreateEventDaysBatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="meal-event-start" className="block text-sm font-medium text-slate-700 mb-1">
                Từ ngày (hoặc ngày đơn lẻ)
              </label>
              <input id="meal-event-start"
                type="date"
                value={evStartDate}
                onChange={(e) => setEvStartDate(e.target.value)}
                className={systemField}
              />
            </div>
            <div>
              <label htmlFor="meal-event-end" className="block text-sm font-medium text-slate-700 mb-1">
                Đến ngày (để trống nếu 1 ngày)
              </label>
              <input id="meal-event-end"
                type="date"
                value={evEndDate}
                onChange={(e) => setEvEndDate(e.target.value)}
                className={systemField}
              />
            </div>
            <div>
              <label htmlFor="meal-event-type" className="block text-sm font-medium text-slate-700 mb-1">
                Loại ngày áp dụng
              </label>
              <select id="meal-event-type"
                value={evSelectedDayType}
                onChange={(e) => setEvSelectedDayType(e.target.value)}
                className={systemField}
              >
                {priceConfigs
                  .filter((p) => p.day_type !== "NORMAL")
                  .map((p) => {
                    const bf = p.foreign_breakfast_price ?? 30000;
                    const dn = p.foreign_dinner_price ?? 40000;
                    const lc = p.janitor_meal_price ?? 25000;
                    return (
                      <option key={p.id} value={p.day_type}>
                        {p.day_type_name || p.day_type} (Sáng NNN: {bf.toLocaleString()} VNĐ | Tối NNN: {dn.toLocaleString()} VNĐ | Tạp vụ: {lc.toLocaleString()} VNĐ)
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="meal-event-notes" className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú sự kiện (Tùy chọn)
            </label>
            <input id="meal-event-notes"
              type="text"
              placeholder="VD: Chủ tịch sang thăm nhà máy, Đợt liên hoan..."
              value={evNotes}
              onChange={(e) => setEvNotes(e.target.value)}
              className={systemField}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={systemPrimaryButton}
            >
               Áp dụng Sự kiện
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="font-semibold text-slate-800">
            📅 Danh sách Ngày Sự kiện đã thiết lập ({eventDays.length})
          </h4>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Bảng ngày sự kiện" tabIndex={0}>
          <table className="w-full min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">STT</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Ngày</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Loại Sự kiện</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Đơn giá Áp dụng</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Ghi chú</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {eventDays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 italic">
                    Chưa có ngày sự kiện nào được thiết lập.
                  </td>
                </tr>
              ) : (
                eventDays.map((ev, idx) => {
                  const cfg = priceConfigs.find((p) => p.day_type === ev.event_type);
                  const isEditing = editingEvId === ev.id;
                  const cfgBf = cfg?.foreign_breakfast_price ?? 30000;
                  const cfgDn = cfg?.foreign_dinner_price ?? 40000;
                  const cfgLc = cfg?.janitor_meal_price ?? 25000;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {isEditing ? (
                          <input
                            type="date"
                            aria-label="Sửa ngày sự kiện" value={editingEvDate}
                            onChange={(e) => setEditingEvDate(e.target.value)}
                            className={systemField}
                          />
                        ) : (
                          ev.event_date
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            aria-label="Sửa loại sự kiện" value={editingEvType}
                            onChange={(e) => setEditingEvType(e.target.value)}
                            className={systemField}
                          >
                            {priceConfigs
                              .filter((p) => p.day_type !== "NORMAL")
                              .map((p) => (
                                <option key={p.id} value={p.day_type}>
                                  {p.day_type_name || p.day_type}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold text-slate-700">
                            {cfg?.day_type_name || ev.event_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium text-xs">
                        {cfg ? (
                          <div className="space-y-0.5 font-mono">
                            <div>Sáng NNN: {cfgBf.toLocaleString()} VNĐ</div>
                            <div>Tối NNN: {cfgDn.toLocaleString()} VNĐ</div>
                            <div>Tạp vụ: {cfgLc.toLocaleString()} VNĐ</div>
                          </div>
                        ) : (
                          "Mặc định"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            aria-label="Sửa ghi chú sự kiện" value={editingEvNotes}
                            onChange={(e) => setEditingEvNotes(e.target.value)}
                            className={systemField}
                          />
                        ) : (
                          ev.notes || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEditEventDay(ev.id)}
                              className={systemTextButton}
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEditEventDay}
                              className={systemTextButton}
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditEventDay(ev)}
                              className={systemTextButton}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteEventDay(ev.id)}
                              className="min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
