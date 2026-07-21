import React, { useState, useEffect } from "react";
import type { Room, RoomCreate } from "../types";
import { fetchRooms, createRoom, updateRoom, deleteRoom } from "../api";

export const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomNumber("");
    setNotes("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setNotes(room.notes || "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError("Vui lòng nhập Số phòng.");
      return;
    }

    try {
      const payload: RoomCreate = {
        room_number: roomNumber.trim(),
        notes: notes.trim() || null,
      };
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
      } else {
        await createRoom(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng KTX này?")) return;
    try {
      await deleteRoom(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa phòng đang có đợt lưu trú liên kết.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh mục Phòng KTX</h2>
          <p className="text-sm text-slate-500">Quản lý các phòng KTX sẵn sàng bố trí lưu trú</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          + Thêm Phòng KTX
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-400">Đang tải danh sách phòng...</div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400">Chưa có phòng KTX nào.</div>
        ) : (
          rooms.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800">Phòng {r.room_number}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                    Sẵn sàng
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{r.notes || "Không có ghi chú"}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => openEditModal(r)}
                  className="text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingRoom ? "Chỉnh sửa Phòng KTX" : "Thêm Phòng KTX Mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="VD: 101, 102, A203"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Mô tả</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Tầng 1, phòng 2 giường..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
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
                  {editingRoom ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
