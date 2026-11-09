import React, { useEffect, useState } from "react";
import { fetchEmployees, fetchRooms, fetchHotels, fetchRoomOccupancy, createStay } from "../api";
import type { ForeignEmployee, Room, Hotel, RoomOccupancy } from "../types";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";
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
  const [roomOccupancy, setRoomOccupancy] = useState<RoomOccupancy[]>([]);
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
    const loadOptions = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const [empData, roomData, hotelData, occupancyData] = await Promise.all([
          fetchEmployees(),
          fetchRooms(),
          fetchHotels(),
          fetchRoomOccupancy(),
        ]);
        setEmployees(empData);
        setRooms(roomData);
        setHotels(hotelData);
        setRoomOccupancy(occupancyData);

        if (defaultEmployeeId) {
          setSelectedEmployeeId(defaultEmployeeId);
        }

        if (defaultAccommodationType === "KTX" && defaultUnitId) {
          setRoomId(defaultUnitId);
        } else if (defaultAccommodationType === "HOTEL" && defaultUnitId) {
          setHotelId(defaultUnitId);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách chọn");
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [isOpen, defaultAccommodationType, defaultUnitId, defaultEmployeeId]);

  const handleTypeChange = (type: "KTX" | "HOTEL"): void => {
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
  const hasUpcomingArrival = Boolean(
    selectedEmployee?.entry_date &&
    selectedEmployee.entry_date > new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (selectedEmployee?.work_type) {
      setStayType(selectedEmployee.work_type as "CO_DINH" | "CONG_TAC");
    }
  }, [selectedEmployee?.id, selectedEmployee?.work_type]);

  useEffect(() => {
    if (selectedEmployee?.entry_date && startDate < selectedEmployee.entry_date) {
      setStartDate(selectedEmployee.entry_date);
    }
  }, [selectedEmployee?.entry_date, startDate]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("Vui lòng chọn Nhân viên nước ngoài");
      return;
    }
    if (selectedEmployee && !selectedEmployee.is_in_vietnam && !hasUpcomingArrival) {
      setError(
        `Nhân sự ${selectedEmployee.name_latin} hiện đang ở nước ngoài (chưa có Đợt nhập cảnh active). Vui lòng tạo Đợt nhập cảnh trước khi xếp chỗ ở.`
      );
      return;
    }
    if (selectedEmployee?.entry_date && startDate < selectedEmployee.entry_date) {
      setError(`Ngày bắt đầu ở phải từ ngày đến Việt Nam (${selectedEmployee.entry_date}) trở đi.`);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể xếp người vào chỗ ở");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <SystemDialog isOpen={isOpen} onClose={onClose} title="Xếp chỗ ở" wide>
        {error && (
          <div role="alert" className="mb-4 rounded-sm border border-red-200 p-3 text-sm text-red-800">
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
              roomOccupancy={roomOccupancy}
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
                className={systemSecondaryButton}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={systemPrimaryButton}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận xếp chỗ"}
              </button>
            </div>
          </form>
        )}
    </SystemDialog>
  );
};
