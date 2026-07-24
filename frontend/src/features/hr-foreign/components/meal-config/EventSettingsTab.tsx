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
          ? `✓ Đã đánh dấu ngày sự kiện đơn lẻ (${result[0].event_date}) thành công!`
          : `✓ Đã cài đặt sự kiện cho khoảng ${count} ngày (${result[0].event_date} ➔ ${
              result[count - 1].event_date
            })!`
      );

      setEvStartDate("");
      setEvEndDate("");
      setEvNotes("");
      onDataChange();
    } catch (err: any) {
      setError(err.message || "Không thể cài đặt sự kiện");
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
      setSuccessMsg("✓ Đã cập nhật ngày sự kiện thành công!");
      setEditingEvId(null);
      onDataChange();
    } catch (err: any) {
      alert(`Lỗi khi cập nhật ngày sự kiện: ${err.message}`);
    }
  };

  const handleDeleteEventDay = async (id: number) => {
    if (!window.confirm("Xóa ngày sự kiện này?")) return;
    try {
      await deleteEventDay(id);
      setSuccessMsg("✓ Đã xóa ngày sự kiện!");
      onDataChange();
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🎯 Cài đặt Sự kiện / Ngày đặc biệt
        </h3>
        <form onSubmit={handleCreateEventDaysBatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày (hoặc ngày đơn lẻ)
              </label>
              <input
                type="date"
                value={evStartDate}
                onChange={(e) => setEvStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày (để trống nếu 1 ngày)
              </label>
              <input
                type="date"
                value={evEndDate}
                onChange={(e) => setEvEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại ngày áp dụng
              </label>
              <select
                value={evSelectedDayType}
                onChange={(e) => setEvSelectedDayType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                {priceConfigs
                  .filter((p) => p.day_type !== "NORMAL")
                  .map((p) => (
                    <option key={p.id} value={p.day_type}>
                      {p.day_type_name || p.day_type} ({p.price_per_meal.toLocaleString()} VNĐ)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú sự kiện (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Chủ tịch sang thăm nhà máy, Đợt liên hoan..."
              value={evNotes}
              onChange={(e) => setEvNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition duration-150"
            >
              ➕ Áp dụng Sự kiện
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h4 className="font-semibold text-gray-800">
            📅 Danh sách Ngày Sự kiện đã thiết lập ({eventDays.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">STT</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Loại Sự kiện</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Đơn giá Áp dụng</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ghi chú</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {eventDays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic">
                    Chưa có ngày sự kiện nào được thiết lập.
                  </td>
                </tr>
              ) : (
                eventDays.map((ev, idx) => {
                  const cfg = priceConfigs.find((p) => p.day_type === ev.event_type);
                  const isEditing = editingEvId === ev.id;
                  return (
                    <tr key={ev.id} className="hover:bg-blue-50/50 transition">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editingEvDate}
                            onChange={(e) => setEditingEvDate(e.target.value)}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          ev.event_date
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editingEvType}
                            onChange={(e) => setEditingEvType(e.target.value)}
                            className="px-2 py-1 border rounded"
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            {cfg?.day_type_name || ev.event_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {cfg ? `${cfg.price_per_meal.toLocaleString()} VNĐ` : "Mặc định"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingEvNotes}
                            onChange={(e) => setEditingEvNotes(e.target.value)}
                            className="px-2 py-1 border rounded w-full"
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
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEditEventDay}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditEventDay(ev)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteEventDay(ev.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
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
