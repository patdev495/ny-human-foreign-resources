import React from "react";
import type { ForeignEmployee, Hotel, Room } from "../../types";

interface Props {
  employees: ForeignEmployee[];
  rooms: Room[];
  hotels: Hotel[];
  selectedEmployeeId: number | "";
  setSelectedEmployeeId: (id: number | "") => void;
  accommodationType: "KTX" | "HOTEL";
  handleTypeChange: (type: "KTX" | "HOTEL") => void;
  roomId: number | "";
  setRoomId: (id: number | "") => void;
  hotelId: number | "";
  setHotelId: (id: number | "") => void;
  hotelRoomNumber: string;
  setHotelRoomNumber: (num: string) => void;
  bedLocation: string;
  setBedLocation: (loc: string) => void;
  stayType: "CO_DINH" | "CONG_TAC";
  setStayType: (type: "CO_DINH" | "CONG_TAC") => void;
  hasMeals: boolean;
  setHasMeals: (meals: boolean) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  expectedEndDate: string;
  setExpectedEndDate: (d: string) => void;
  notes: string;
  setNotes: (n: string) => void;
  hasActiveAccommodation: boolean;
  selectedEmployee?: ForeignEmployee;
}

export const CheckInFormFields: React.FC<Props> = ({
  employees,
  rooms,
  hotels,
  selectedEmployeeId,
  setSelectedEmployeeId,
  accommodationType,
  handleTypeChange,
  roomId,
  setRoomId,
  hotelId,
  setHotelId,
  hotelRoomNumber,
  setHotelRoomNumber,
  bedLocation,
  setBedLocation,
  stayType,
  setStayType,
  hasMeals,
  setHasMeals,
  startDate,
  setStartDate,
  expectedEndDate,
  setExpectedEndDate,
  notes,
  setNotes,
  hasActiveAccommodation,
  selectedEmployee,
}) => {
  return (
    <>
      {/* Type switch */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Loại chỗ ở <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange("KTX")}
            className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              accommodationType === "KTX"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-bold"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            🏫 Ký túc xá (KTX)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("HOTEL")}
            className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              accommodationType === "HOTEL"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-bold"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            🏨 Khách sạn
          </button>
        </div>
      </div>

      {/* Select Employee */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Nhân viên nước ngoài <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : "")}
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- Chọn nhân viên --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name_latin} {emp.name_chinese ? `(${emp.name_chinese})` : ""} - {emp.employee_code || "Chưa có mã"}
              {emp.current_room_number ? ` [Đang ở: ${emp.current_room_number}]` : ""}
            </option>
          ))}
        </select>
        {selectedEmployee && !selectedEmployee.is_in_vietnam && (
          <p className="mt-1 text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2 rounded-lg">
            ⚠️ Nhân sự <strong>{selectedEmployee.name_latin}</strong> hiện đang ở nước ngoài (chưa có Đợt nhập cảnh active). Vui lòng tạo Đợt nhập cảnh trước khi xếp chỗ ở.
          </p>
        )}
        {selectedEmployee && selectedEmployee.is_in_vietnam && hasActiveAccommodation && (
          <p className="mt-1 text-xs text-amber-600 font-medium">
            ⚠️ Nhân sự này hiện đang lưu trú tại: <strong>{selectedEmployee.current_room_number}</strong>.
          </p>
        )}
      </div>

      {/* Select Room or Hotel */}
      {accommodationType === "KTX" ? (
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Phòng KTX <span className="text-red-500">*</span>
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Chọn phòng KTX --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Phòng {r.room_number}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Khách sạn <span className="text-red-500">*</span>
            </label>
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value ? Number(e.target.value) : "")}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Chọn Khách sạn --</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Số phòng Khách sạn
            </label>
            <input
              type="text"
              placeholder="VD: 302, Suite A"
              value={hotelRoomNumber}
              onChange={(e) => setHotelRoomNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Bed & Stay Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Vị trí giường (Tùy chọn)
          </label>
          <input
            type="text"
            placeholder="VD: Giường 1 - Tầng dưới"
            value={bedLocation}
            onChange={(e) => setBedLocation(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Loại hình lưu trú
          </label>
          <select
            value={stayType}
            onChange={(e) => setStayType(e.target.value as "CO_DINH" | "CONG_TAC")}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="CO_DINH">Cố định</option>
            <option value="CONG_TAC">Công tác ngắn hạn</option>
          </select>
        </div>
      </div>

      {/* Has meals toggle */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <input
          type="checkbox"
          id="checkin-has-meals"
          checked={hasMeals}
          onChange={(e) => setHasMeals(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
        />
        <label htmlFor="checkin-has-meals" className="text-xs font-bold text-slate-800 cursor-pointer">
          Đăng ký suất ăn KTX hàng ngày cho nhân sự này
        </label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Ngày bắt đầu ở <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Dự kiến trả phòng
          </label>
          <input
            type="date"
            value={expectedEndDate}
            onChange={(e) => setExpectedEndDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Ghi chú
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </>
  );
};
