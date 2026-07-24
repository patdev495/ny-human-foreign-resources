import React, { useState, useEffect } from "react";
import type { ForeignEmployee, Room, Stay, StayCreate } from "../types";
import { fetchStays, createStay, updateStay, fetchEmployees, fetchRooms } from "../api";
import { StayFormModal } from "./stay-list/StayFormModal";

interface StayListProps {
  onSelectStay?: (stay: Stay) => void;
}

export const StayList: React.FC<StayListProps> = ({ onSelectStay }) => {
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [accommodationType, setAccommodationType] = useState<"KTX" | "HOTEL">("KTX");
  const [roomId, setRoomId] = useState<number | "">("");
  const [stayType, setStayType] = useState<"CO_DINH" | "CONG_TAC">("CO_DINH");
  const [hasMeals, setHasMeals] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stayData, empData, roomData] = await Promise.all([
        fetchStays(),
        fetchEmployees(),
        fetchRooms(),
      ]);
      setStays(stayData);
      setEmployees(empData);
      setRooms(roomData);
    } catch (err) {
      console.error("Failed to load stay data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingStay(null);
    setEmployeeId(employees.length > 0 ? employees[0].id : "");
    setAccommodationType("KTX");
    setRoomId(rooms.length > 0 ? rooms[0].id : "");
    setStayType("CO_DINH");
    setHasMeals(true);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setNotes("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (stay: Stay) => {
    setEditingStay(stay);
    setEmployeeId(stay.employee_id);
    setAccommodationType(stay.accommodation_type);
    setRoomId(stay.room_id || "");
    setStayType(stay.stay_type);
    setHasMeals(stay.has_meals);
    setStartDate(stay.start_date || "");
    setEndDate(stay.end_date || "");
    setNotes(stay.notes || "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) { setError("Vui lòng chọn nhân sự."); return; }

    if (!editingStay) {
      const sel = employees.find((emp) => emp.id === Number(employeeId));
      if (sel && sel.current_room_number) {
        setError(`Nhân sự ${sel.name_latin} đang có chỗ ở (${sel.current_room_number}). Vui lòng Trả phòng cũ trước.`);
        return;
      }
    }

    if (!startDate) { setError("Vui lòng chọn ngày bắt đầu."); return; }
    if (accommodationType === "KTX" && !roomId) { setError("Vui lòng chọn số phòng KTX."); return; }

    try {
      const payload: StayCreate = {
        employee_id: Number(employeeId),
        accommodation_type: accommodationType,
        room_id: accommodationType === "KTX" && roomId ? Number(roomId) : null,
        stay_type: stayType,
        has_meals: accommodationType === "KTX" ? hasMeals : false,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes.trim() || null,
      };
      if (editingStay) {
        await updateStay(editingStay.id, payload);
      } else {
        await createStay(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    }
  };

  const getEmpName = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.name_latin} (${emp.passport_number})` : `#${id}`;
  };

  const getRoomNumber = (rId?: number | null) => {
    if (!rId) return "-";
    const room = rooms.find((r) => r.id === rId);
    return room ? room.room_number : `#${rId}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Đợt Lưu Trú (Stays)</h2>
          <p className="text-sm text-slate-500">Ghi nhận thông tin công tác & nơi lưu trú tại Việt Nam</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          + Đăng ký Đợt Lưu Trú
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Mã Stay</th>
              <th className="px-4 py-3">Nhân Sự</th>
              <th className="px-4 py-3">Loại Lưu Trú</th>
              <th className="px-4 py-3">Số Phòng</th>
              <th className="px-4 py-3">Hình Thức</th>
              <th className="px-4 py-3">Cờ Ăn KTX</th>
              <th className="px-4 py-3">Thời Gian</th>
              <th className="px-4 py-3">Trạng Thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Đang tải danh sách lưu trú...
                </td>
              </tr>
            ) : stays.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Chưa có đợt lưu trú nào.
                </td>
              </tr>
            ) : (
              stays.map((stay) => {
                const isActive = !stay.end_date || stay.end_date >= new Date().toISOString().split("T")[0];
                return (
                  <tr key={stay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">#{stay.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectStay?.(stay)}
                        className="hover:underline text-blue-600 text-left cursor-pointer"
                      >
                        {getEmpName(stay.employee_id)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          stay.accommodation_type === "KTX"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {stay.accommodation_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{getRoomNumber(stay.room_id)}</td>
                    <td className="px-4 py-3">
                      {stay.stay_type === "CO_DINH" ? "Cố định" : "Công tác"}
                    </td>
                    <td className="px-4 py-3">
                      {stay.accommodation_type === "KTX" ? (
                        stay.has_meals ? (
                          <span className="text-emerald-600 font-semibold"> Có ăn</span>
                        ) : (
                          <span className="text-slate-400">Không ăn</span>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {stay.start_date} &rarr; {stay.end_date || "Hiện tại"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isActive ? "Đang lưu trú" : "Đã kết thúc"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(stay)}
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        {isActive ? "Cập nhật / Kết thúc" : "Chỉnh sửa"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <StayFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingStay={editingStay}
        error={error}
        employees={employees}
        rooms={rooms}
        employeeId={employeeId}
        setEmployeeId={setEmployeeId}
        accommodationType={accommodationType}
        setAccommodationType={setAccommodationType}
        roomId={roomId}
        setRoomId={setRoomId}
        stayType={stayType}
        setStayType={setStayType}
        hasMeals={hasMeals}
        setHasMeals={setHasMeals}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        notes={notes}
        setNotes={setNotes}
      />
    </div>
  );
};
