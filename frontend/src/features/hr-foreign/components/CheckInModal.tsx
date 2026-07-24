import React, { useEffect, useState } from "react";
import { fetchEmployees, fetchRooms, fetchHotels, createStay } from "../api";
import type { ForeignEmployee, Room, Hotel } from "../types";
import { CheckInFormFields } from "./check-in/CheckInFormFields";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAccommodationType?: "KTX" | "HOTEL";
  defaultUnitId?: number;
  defaultEmployeeId?: number;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAccommodationType = "KTX",
  defaultUnitId,
  defaultEmployeeId,
}) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">(
    defaultEmployeeId || ""
  );
  const [accommodationType, setAccommodationType] = useState<"KTX" | "HOTEL">(
    defaultAccommodationType
  );
  const [roomId, setRoomId] = useState<number | "">(
    defaultAccommodationType === "KTX" && defaultUnitId ? defaultUnitId : ""
  );
  const [hotelId, setHotelId] = useState<number | "">(
    defaultAccommodationType === "HOTEL" && defaultUnitId ? defaultUnitId : ""
  );
  const [hotelRoomNumber, setHotelRoomNumber] = useState("");
  const [bedLocation, setBedLocation] = useState("");
  const [stayType, setStayType] = useState<"CO_DINH" | "CONG_TAC">(
    defaultAccommodationType === "KTX" ? "CO_DINH" : "CONG_TAC"
  );
  const [hasMeals, setHasMeals] = useState<boolean>(defaultAccommodationType === "KTX");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expectedEndDate, setExpectedEndDate] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const [empData, roomData, hotelData] = await Promise.all([
          fetchEmployees(),
          fetchRooms(),
          fetchHotels(),
        ]);
        setEmployees(empData);
        setRooms(roomData);
        setHotels(hotelData);

        if (defaultEmployeeId) {
          setSelectedEmployeeId(defaultEmployeeId);
        }

        if (defaultAccommodationType === "KTX" && defaultUnitId) {
          setRoomId(defaultUnitId);
        } else if (defaultAccommodationType === "HOTEL" && defaultUnitId) {
          setHotelId(defaultUnitId);
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách chọn");
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [isOpen, defaultAccommodationType, defaultUnitId, defaultEmployeeId]);

  const handleTypeChange = (type: "KTX" | "HOTEL") => {
    setAccommodationType(type);
    if (type === "KTX") {
      setStayType("CO_DINH");
      setHasMeals(true);
    } else {
      setStayType("CONG_TAC");
      setHasMeals(false);
    }
  };

  const selectedEmployee = employees.find(
    (emp) => emp.id === Number(selectedEmployeeId)
  );
  const hasActiveAccommodation = Boolean(
    selectedEmployee && selectedEmployee.current_room_number
  );

  useEffect(() => {
    if (selectedEmployee && selectedEmployee.work_type) {
      setStayType(selectedEmployee.work_type as "CO_DINH" | "CONG_TAC");
    }
  }, [selectedEmployeeId, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("Vui lòng chọn Nhân viên nước ngoài");
      return;
    }
    if (selectedEmployee && hasActiveAccommodation) {
      setError(
        `Nhân sự ${selectedEmployee.name_latin} hiện đang có chỗ ở (${selectedEmployee.current_room_number}). Vui lòng làm thủ tục Trả phòng cũ trước khi xếp mới.`
      );
      return;
    }
    if (accommodationType === "KTX" && !roomId) {
      setError("Vui lòng chọn Phòng KTX");
      return;
    }
    if (accommodationType === "HOTEL" && !hotelId) {
      setError("Vui lòng chọn Khách sạn");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createStay({
        employee_id: Number(selectedEmployeeId),
        accommodation_type: accommodationType,
        room_id: accommodationType === "KTX" ? Number(roomId) : undefined,
        hotel_id: accommodationType === "HOTEL" ? Number(hotelId) : undefined,
        hotel_room_number:
          accommodationType === "HOTEL" && hotelRoomNumber.trim()
            ? hotelRoomNumber.trim()
            : undefined,
        bed_location: bedLocation.trim() || undefined,
        stay_type: stayType,
        has_meals: hasMeals,
        start_date: startDate || undefined,
        expected_end_date: expectedEndDate || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể xếp người vào chỗ ở");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            🏢 Xếp người vào chỗ ở mới
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <CheckInFormFields
              employees={employees}
              rooms={rooms}
              hotels={hotels}
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
              accommodationType={accommodationType}
              handleTypeChange={handleTypeChange}
              roomId={roomId}
              setRoomId={setRoomId}
              hotelId={hotelId}
              setHotelId={setHotelId}
              hotelRoomNumber={hotelRoomNumber}
              setHotelRoomNumber={setHotelRoomNumber}
              bedLocation={bedLocation}
              setBedLocation={setBedLocation}
              stayType={stayType}
              setStayType={setStayType}
              hasMeals={hasMeals}
              setHasMeals={setHasMeals}
              startDate={startDate}
              setStartDate={setStartDate}
              expectedEndDate={expectedEndDate}
              setExpectedEndDate={setExpectedEndDate}
              notes={notes}
              setNotes={setNotes}
              hasActiveAccommodation={hasActiveAccommodation}
              selectedEmployee={selectedEmployee}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-60"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận xếp chỗ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
