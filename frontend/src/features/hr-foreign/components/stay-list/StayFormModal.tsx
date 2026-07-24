import React from "react";
import type { ForeignEmployee, Room, Stay } from "../../types";

interface StayFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingStay: Stay | null;
  error: string | null;

  employees: ForeignEmployee[];
  rooms: Room[];

  employeeId: number | "";
  setEmployeeId: (id: number | "") => void;
  accommodationType: "KTX" | "HOTEL";
  setAccommodationType: (t: "KTX" | "HOTEL") => void;
  roomId: number | "";
  setRoomId: (id: number | "") => void;
  stayType: "CO_DINH" | "CONG_TAC";
  setStayType: (t: "CO_DINH" | "CONG_TAC") => void;
  hasMeals: boolean;
  setHasMeals: (v: boolean) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  notes: string;
  setNotes: (n: string) => void;
}

export const StayFormModal: React.FC<StayFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStay,
  error,
  employees,
  rooms,
  employeeId,
  setEmployeeId,
  accommodationType,
  setAccommodationType,
  roomId,
  setRoomId,
  stayType,
  setStayType,
  hasMeals,
  setHasMeals,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  notes,
  setNotes,
}) => {
  if (!isOpen) return null;

  const selectedEmp = employees.find((e) => e.id === Number(employeeId));
  const isOccupied = !editingStay && Boolean(selectedEmp?.current_room_number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingStay ? "Cập nhật Đợt Lưu Trú" : "Đăng ký Đợt Lưu Trú Mới"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          {/* Employee selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nhân sự nước ngoài <span className="text-red-500">*</span>
            </label>
            <select
              disabled={!!editingStay}
              value={employeeId}
              onChange={(e) => setEmployeeId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name_latin} ({emp.passport_number}) - {emp.department || "N/A"}
                  {emp.current_room_number ? ` ⚠️ [Đang ở: ${emp.current_room_number}]` : ""}
                </option>
              ))}
            </select>
            {isOccupied && selectedEmp && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-1">
                <div className="font-bold text-amber-800">⚠️ Cảnh báo: Nhân sự này đang có chỗ ở!</div>
                <p>
                  Nhân sự <strong>{selectedEmp.name_latin}</strong> hiện đang có chỗ ở tại:{" "}
                  <strong>{selectedEmp.current_room_number}</strong>.
                </p>
                <p className="text-red-700 font-bold">⛔ Vui lòng làm thủ tục Trả phòng cũ trước khi thêm mới.</p>
              </div>
            )}
          </div>

          {/* Accommodation type + room */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nơi ở</label>
              <select
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value as "KTX" | "HOTEL")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="KTX">Ký túc xá (KTX)</option>
                <option value="HOTEL">Khách sạn</option>
              </select>
            </div>
            {accommodationType === "KTX" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phòng KTX</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.room_number}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Stay type + has meals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
              <select
                value={stayType}
                onChange={(e) => setStayType(e.target.value as "CO_DINH" | "CONG_TAC")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="CO_DINH">Cố định (Dài hạn)</option>
                <option value="CONG_TAC">Công tác (Ngắn hạn)</option>
              </select>
            </div>
            {accommodationType === "KTX" && (
              <div className="flex items-center pt-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMeals}
                    onChange={(e) => setHasMeals(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">Đăng ký ăn KTX</span>
                </label>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày kết thúc (Để trống nếu ongoing)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium cursor-pointer"
            >
              {editingStay ? "Cập nhật" : "Tạo đợt lưu trú"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
