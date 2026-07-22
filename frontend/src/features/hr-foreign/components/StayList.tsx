import React, { useState, useEffect } from "react";
import type { ForeignEmployee, Room, Stay, StayCreate } from "../types";
import { fetchStays, createStay, updateStay, fetchEmployees, fetchRooms } from "../api";

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

  useEffect(() => {
    loadData();
  }, []);

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
    if (!employeeId) {
      setError("Vui lòng chọn nhân sự.");
      return;
    }

    if (!editingStay) {
      const sel = employees.find((emp) => emp.id === Number(employeeId));
      if (sel && sel.current_room_number) {
        setError(
          `Nhân sự ${sel.name_latin} hiện đang có chỗ ở (${sel.current_room_number}). Vui lòng làm thủ tục Trả phòng cũ trước khi thêm mới.`
        );
        return;
      }
    }

    if (!startDate) {
      setError("Vui lòng chọn ngày bắt đầu.");
      return;
    }
    if (accommodationType === "KTX" && !roomId) {
      setError("Vui lòng chọn số phòng KTX.");
      return;
    }

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
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
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
                          isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingStay ? "Cập nhật Đợt Lưu Trú" : "Đăng ký Đợt Lưu Trú Mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nhân sự nước ngoài <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={!!editingStay}
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(Number(e.target.value));
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  {employees.map((emp) => {
                    const isOccupied = Boolean(emp.current_room_number);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.name_latin} ({emp.passport_number}) - {emp.department || "N/A"}
                        {isOccupied ? ` ⚠️ [Đang ở: ${emp.current_room_number}]` : ""}
                      </option>
                    );
                  })}
                </select>
                {!editingStay && (() => {
                  const sel = employees.find((e) => e.id === Number(employeeId));
                  const busy = Boolean(sel && sel.current_room_number);
                  if (!sel || !busy) return null;
                  return (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <span>⚠️ Cảnh báo: Nhân sự này đang có chỗ ở!</span>
                      </div>
                      <p>
                        Nhân sự <strong>{sel.name_latin}</strong> hiện đang có chỗ ở tại:{" "}
                        <strong>{sel.current_room_number}</strong>.
                      </p>
                      <p className="text-red-700 font-bold">
                        ⛔ Vui lòng làm thủ tục Trả phòng cũ trước khi thêm mới.
                      </p>
                    </div>
                  );
                })()}
              </div>

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc (Để trống nếu ongoing)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
};
