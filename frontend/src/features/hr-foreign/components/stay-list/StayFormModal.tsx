import React from "react";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";
import type { ForeignEmployee, Room, Stay } from "../../types";

interface StayFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingStay: Stay | null;
  error: string | null;
  submitting?: boolean;

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
  submitting = false,
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
    <SystemDialog isOpen={isOpen} onClose={onClose} title={editingStay ? "Cập nhật đợt lưu trú" : "Đăng ký đợt lưu trú"} wide>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-sm border border-red-200 p-3 text-sm text-red-800">{error}</div>
          )}

          {/* Employee selector */}
          <div>
            <label htmlFor="stay-employee" className="block text-sm font-medium text-slate-700 mb-1">
              Nhân sự nước ngoài <span className="text-red-500">*</span>
            </label>
            <select id="stay-employee"
              disabled={!!editingStay}
              value={employeeId}
              onChange={(e) => setEmployeeId(Number(e.target.value))}
              className={systemField}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name_latin} ({emp.passport_number}) - {emp.department || "N/A"}
                  {emp.current_room_number ? ` [Đang ở: ${emp.current_room_number}]` : ""}
                </option>
              ))}
            </select>
            {isOccupied && selectedEmp && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-1">
                <div className="font-bold text-amber-800">Cảnh báo: Nhân sự này đang có chỗ ở!</div>
                <p>
                  Nhân sự <strong>{selectedEmp.name_latin}</strong> hiện đang có chỗ ở tại:{" "}
                  <strong>{selectedEmp.current_room_number}</strong>.
                </p>
                <p className="text-red-700 font-bold">Vui lòng làm thủ tục Trả phòng cũ trước khi thêm mới.</p>
              </div>
            )}
          </div>

          {/* Accommodation type + room */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stay-location" className="block text-sm font-medium text-slate-700 mb-1">Nơi ở</label>
              <select id="stay-location"
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value as "KTX" | "HOTEL")}
                className={systemField}
              >
                <option value="KTX">Ký túc xá (KTX)</option>
                <option value="HOTEL">Khách sạn</option>
              </select>
            </div>
            {accommodationType === "KTX" && (
              <div>
                <label htmlFor="stay-room" className="block text-sm font-medium text-slate-700 mb-1">Phòng KTX</label>
                <select id="stay-room"
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                  className={systemField}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stay-type" className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
              <select id="stay-type"
                value={stayType}
                onChange={(e) => setStayType(e.target.value as "CO_DINH" | "CONG_TAC")}
                className={systemField}
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
                  <span className="ml-2 text-sm font-medium text-slate-700">Có ăn tại KTX</span>
                </label>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stay-start" className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
              <input id="stay-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={systemField}
              />
            </div>
            <div>
              <label htmlFor="stay-end" className="block text-sm font-medium text-slate-700 mb-1">
                Ngày kết thúc (để trống nếu đang ở)
              </label>
              <input id="stay-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={systemField}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="stay-notes" className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea id="stay-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={systemField}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className={systemSecondaryButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={systemPrimaryButton}
            >
              {submitting ? "Đang lưu…" : editingStay ? "Cập nhật" : "Tạo đợt lưu trú"}
            </button>
          </div>
        </form>
    </SystemDialog>
  );
};
