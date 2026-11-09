import React from "react";
import { SystemTabs } from "../../../../shared/components/SystemTabs";
import { systemField } from "../../../../shared/components/systemStyles";
import type { ForeignEmployee, Hotel, Room, RoomOccupancy } from "../../types";

interface Props {
  employees: ForeignEmployee[];
  rooms: Room[];
  roomOccupancy: RoomOccupancy[];
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
  roomOccupancy,
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
  return <div className="space-y-4">
    <div><p className="mb-1 text-sm text-slate-700">Loại chỗ ở</p>
      <SystemTabs label="Chọn loại chỗ ở" active={accommodationType} onChange={handleTypeChange} items={[{ key: "KTX", label: "Ký túc xá (KTX)" }, { key: "HOTEL", label: "Khách sạn" }]} />
    </div>
    <div><label htmlFor="checkin-employee" className="mb-1.5 block text-sm text-slate-700">Nhân viên nước ngoài <span className="text-red-700">*</span></label>
      <select id="checkin-employee" required value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value ? Number(event.target.value) : "")} className={systemField}>
        <option value="">Chọn nhân viên</option>
        {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name_latin}{emp.name_chinese ? ` (${emp.name_chinese})` : ""} · {emp.employee_code || "Chưa có mã"}{emp.current_room_number ? ` [Đang ở: ${emp.current_room_number}]` : ""}</option>)}
      </select>
      {selectedEmployee && !selectedEmployee.is_in_vietnam && (!selectedEmployee.entry_date || selectedEmployee.entry_date <= new Date().toISOString().split("T")[0]) && <p role="alert" className="mt-2 text-sm text-red-800">Nhân sự đang ở nước ngoài. Vui lòng tạo đợt nhập cảnh trước khi xếp chỗ ở.</p>}
      {selectedEmployee && !selectedEmployee.is_in_vietnam && selectedEmployee.entry_date && selectedEmployee.entry_date > new Date().toISOString().split("T")[0] && <p className="mt-2 text-sm text-slate-600">Dự kiến đến ngày {selectedEmployee.entry_date}. Có thể xếp chỗ ở từ ngày này.</p>}
      {selectedEmployee?.is_in_vietnam && hasActiveAccommodation && <p role="alert" className="mt-2 text-sm text-amber-800">Nhân sự đang ở {selectedEmployee.current_room_number}. Cần trả phòng cũ trước khi xếp mới.</p>}
    </div>
    {accommodationType === "KTX" ? <div>
      <label htmlFor="checkin-room" className="mb-1.5 block text-sm text-slate-700">Phòng KTX <span className="text-red-700">*</span></label>
      <select id="checkin-room" required value={roomId} onChange={(event) => setRoomId(event.target.value ? Number(event.target.value) : "")} className={systemField}>
        <option value="">Chọn phòng KTX</option>
        {rooms.map((room) => {
          const unit = roomOccupancy.find((item) => item.accommodation_type === "KTX" && item.room_id === room.id);
          const assigned = (unit?.active_count || 0) + (unit?.scheduled_count || 0);
          return <option key={room.id} value={room.id}>Phòng {room.room_number} · {assigned} đã xếp{room.capacity == null ? "" : ` · ${Math.max(0, room.capacity - assigned)} chỗ chưa xếp`}</option>;
        })}
      </select>
    </div> : <div className="grid gap-3 sm:grid-cols-2">
      <div><label htmlFor="checkin-hotel" className="mb-1.5 block text-sm text-slate-700">Khách sạn <span className="text-red-700">*</span></label>
        <select id="checkin-hotel" required value={hotelId} onChange={(event) => setHotelId(event.target.value ? Number(event.target.value) : "")} className={systemField}>
          <option value="">Chọn khách sạn</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
        </select></div>
      <div><label htmlFor="checkin-hotel-room" className="mb-1.5 block text-sm text-slate-700">Số phòng khách sạn <span className="text-red-700">*</span></label>
        <input id="checkin-hotel-room" required value={hotelRoomNumber} onChange={(event) => setHotelRoomNumber(event.target.value)} placeholder="Ví dụ: 302" className={systemField} /></div>
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label htmlFor="checkin-bed" className="mb-1.5 block text-sm text-slate-700">Vị trí giường</label>
        <input id="checkin-bed" value={bedLocation} onChange={(event) => setBedLocation(event.target.value)} placeholder="Ví dụ: Giường A" className={systemField} /></div>
      <div><label htmlFor="checkin-stay-type" className="mb-1.5 block text-sm text-slate-700">Loại hình</label>
        <select id="checkin-stay-type" value={stayType} onChange={(event) => setStayType(event.target.value as "CO_DINH" | "CONG_TAC")} className={systemField}>
          <option value="CO_DINH">Cố định</option><option value="CONG_TAC">Công tác</option>
        </select></div>
    </div>
    {accommodationType === "KTX" ? <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={hasMeals} onChange={(event) => setHasMeals(event.target.checked)} className="h-4 w-4 accent-slate-800" /> Có ăn tại KTX
    </label> : <p className="text-sm text-slate-600">Lưu trú khách sạn không áp dụng suất ăn KTX.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label htmlFor="checkin-start" className="mb-1.5 block text-sm text-slate-700">Ngày bắt đầu ở <span className="text-red-700">*</span></label>
        <input id="checkin-start" type="date" required value={startDate} min={selectedEmployee?.entry_date || undefined} onChange={(event) => setStartDate(event.target.value)} className={systemField} /></div>
      <div><label htmlFor="checkin-expected-end" className="mb-1.5 block text-sm text-slate-700">Dự kiến trả phòng</label>
        <input id="checkin-expected-end" type="date" value={expectedEndDate} onChange={(event) => setExpectedEndDate(event.target.value)} className={systemField} /></div>
    </div>
    <div><label htmlFor="checkin-notes" className="mb-1.5 block text-sm text-slate-700">Ghi chú</label>
      <textarea id="checkin-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={systemField} /></div>
  </div>;
};
