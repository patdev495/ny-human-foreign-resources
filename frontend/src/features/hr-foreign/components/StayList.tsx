import React, { useState, useEffect, useCallback } from "react";
import type { ForeignEmployee, Room, Stay, StayCreate } from "../types";
import { fetchStays, createStay, updateStay, fetchEmployees, fetchRooms } from "../api";
import { systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";
import { StayFormModal } from "./stay-list/StayFormModal";

interface StayListProps {
  onSelectStay?: (stay: Stay) => void;
}

export const StayList: React.FC<StayListProps> = ({ onSelectStay }) => {
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setLoadError(null);
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
      setLoadError("Không thể tải lịch sử lưu trú. Kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

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

    setSubmitting(true);
    setError(null);
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
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">Các đợt lưu trú <span className="font-normal text-slate-600">({loading || loadError ? "—" : stays.length})</span></h2>
      <button type="button" onClick={openCreateModal} className={systemPrimaryButton}>+ Đăng ký đợt lưu trú</button>
    </div>
    {loadError && <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm text-red-800">{loadError}<button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} ml-3`}>Thử lại</button></div>}
    <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white" role="region" aria-label="Bảng lịch sử lưu trú" tabIndex={0}>
      <table className="w-full min-w-[1050px] text-left text-sm">
        <caption className="sr-only">Lịch sử các đợt lưu trú KTX và khách sạn</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Mã đợt", "Nhân sự", "Loại chỗ ở", "Phòng / Khách sạn", "Loại hình", "Ăn KTX", "Thời gian", "Trạng thái", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">Đang tải lịch sử lưu trú…</td></tr>
            : !loadError && stays.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-600">Chưa có đợt lưu trú nào.</td></tr>
            : !loadError && stays.map((stay) => {
              const isActive = !stay.end_date || stay.end_date > new Date().toISOString().split("T")[0];
              const isScheduled = Boolean(stay.start_date && stay.start_date > new Date().toISOString().split("T")[0]);
              const employee = employees.find((emp) => emp.id === stay.employee_id);
              const roomNumber = stay.room_number || rooms.find((room) => room.id === stay.room_id)?.room_number;
              const location = stay.accommodation_type === "HOTEL" ? `${stay.hotel_name || "Khách sạn"}${stay.hotel_room_number ? ` · Phòng ${stay.hotel_room_number}` : ""}` : roomNumber ? `Phòng ${roomNumber}` : "—";
              return <tr key={stay.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-slate-600">#{stay.id}</td>
                <th scope="row" className="min-w-40 px-3 py-3 font-medium text-slate-900">
                  {onSelectStay ? <button type="button" onClick={() => onSelectStay(stay)} className="cursor-pointer text-left hover:underline">{employee?.name_latin || `#${stay.employee_id}`}</button> : employee?.name_latin || `#${stay.employee_id}`}
                  <span className="mt-0.5 block text-xs font-normal text-slate-600">{employee?.passport_number || "Chưa có hộ chiếu"}</span>
                </th>
                <td className="px-3 py-3 text-slate-600">{stay.accommodation_type === "KTX" ? "KTX" : "Khách sạn"}</td>
                <td className="px-3 py-3 text-slate-700">{location}</td>
                <td className="px-3 py-3 text-slate-600">{stay.stay_type === "CO_DINH" ? "Cố định" : "Công tác"}</td>
                <td className="px-3 py-3 text-slate-600">{stay.accommodation_type !== "KTX" ? "—" : stay.has_meals ? "Có ăn" : "Không ăn"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{stay.start_date || "—"}<span className="block">đến {stay.end_date || (isScheduled ? "chưa xác định" : "hiện tại")}</span></td>
                <td className="px-3 py-3 text-slate-600">{isScheduled ? "Sắp đến" : isActive ? "Đang lưu trú" : "Đã kết thúc"}</td>
                <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => openEditModal(stay)} aria-label={`Cập nhật đợt lưu trú ${stay.id}`} className={systemTextButton}>{isScheduled ? "Cập nhật" : isActive ? "Cập nhật / Kết thúc" : "Chỉnh sửa"}</button></td>
              </tr>;
            })}
        </tbody>
      </table>
    </div>
      <StayFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingStay={editingStay}
        submitting={submitting}
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
  </div>;
};
