import React, { useEffect, useState } from "react";
import { fetchEmployees, fetchRooms, fetchHotels, createStay } from "../api";
import type { ForeignEmployee, Room, Hotel } from "../types";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAccommodationType?: "KTX" | "HOTEL";
  defaultUnitId?: number;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAccommodationType = "KTX",
  defaultUnitId,
}) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
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
  }, [isOpen, defaultAccommodationType, defaultUnitId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError("Vui lòng chọn Nhân viên nước ngoài");
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
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Xếp người vào chỗ ở mới
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chọn loại chỗ ở */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Loại chỗ ở <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange("KTX")}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                    accommodationType === "KTX"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🏫 Ký túc xá (KTX)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("HOTEL")}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                    accommodationType === "HOTEL"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🏨 Khách sạn
                </button>
              </div>
            </div>

            {/* Chọn Nhân viên */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nhân viên nước ngoài <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) =>
                  setSelectedEmployeeId(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">-- Chọn nhân viên trong hệ thống --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name_latin} {emp.name_chinese ? `(${emp.name_chinese})` : ""} - HC:{" "}
                    {emp.passport_number || "Không có"}
                  </option>
                ))}
              </select>
            </div>

            {/* Đơn vị chỗ ở cụ thể */}
            {accommodationType === "KTX" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Số phòng KTX <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Chọn phòng KTX --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.room_number} {r.notes ? `(${r.notes})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Khách sạn đối tác <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={hotelId}
                    onChange={(e) => setHotelId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Chọn khách sạn --</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Số phòng khách sạn
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: P302"
                    value={hotelRoomNumber}
                    onChange={(e) => setHotelRoomNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Ngày bắt đầu ở & Ngày dự kiến về & Vị trí giường */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ngày bắt đầu ở <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ngày dự kiến về (nếu có)
                </label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vị trí giường (nếu có)
              </label>
              <input
                type="text"
                placeholder="Vd: Giường A, Giường 1..."
                value={bedLocation}
                onChange={(e) => setBedLocation(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Loại hình & Ăn uống */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Loại hình
                </label>
                <select
                  value={stayType}
                  onChange={(e) => setStayType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="CO_DINH">Cố định (Ở dài hạn)</option>
                  <option value="CONG_TAC">Công tác (Đợt ngắn hạn)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tính tiền ăn
                </label>
                <label className="inline-flex items-center mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMeals}
                    onChange={(e) => setHasMeals(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-xs font-medium text-slate-700">
                    {hasMeals ? "Có ăn cơm công ty" : "Không ăn cơm"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ghi chú
              </label>
              <input
                type="text"
                placeholder="Ghi chú đợt ở..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận xếp ở"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
