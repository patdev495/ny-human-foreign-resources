import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Room, RoomCreate } from "../types";
import { fetchRooms, createRoom, updateRoom, deleteRoom } from "../api";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";

export function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try { setRooms(await fetchRooms()); }
    catch { setLoadError("Không thể tải danh mục phòng KTX. Kiểm tra kết nối rồi thử lại."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const openModal = (room?: Room): void => {
    setEditingRoom(room ?? null);
    setRoomNumber(room?.room_number || "");
    setCapacity(room?.capacity?.toString() || "");
    setNotes(room?.notes || "");
    setError(null);
    setIsModalOpen(true);
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!roomNumber.trim()) { setError("Vui lòng nhập số phòng."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const payload: RoomCreate = { room_number: roomNumber.trim(), capacity: capacity ? Number(capacity) : null, notes: notes.trim() || null };
      if (editingRoom) await updateRoom(editingRoom.id, payload);
      else await createRoom(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Không thể lưu phòng KTX."); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async (room: Room): Promise<void> => {
    if (!window.confirm(`Bạn có chắc muốn xóa phòng KTX ${room.room_number}?`)) return;
    try { await deleteRoom(room.id); await loadData(); }
    catch { setLoadError("Không thể xóa phòng đang có đợt lưu trú liên kết."); }
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">Danh mục phòng KTX <span className="font-normal text-slate-600">({loading || loadError ? "—" : rooms.length})</span></h2>
      <button type="button" onClick={() => openModal()} className={systemPrimaryButton}><Plus className="h-4 w-4" aria-hidden="true" /> Thêm phòng KTX</button>
    </div>
    {loadError && <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm text-red-800">{loadError}<button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} ml-3`}>Thử lại</button></div>}
    <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white" role="region" aria-label="Danh mục phòng KTX" tabIndex={0}>
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">Danh mục phòng KTX và sức chứa</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Số phòng", "Sức chứa", "Ghi chú", "Thao tác"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">Đang tải danh sách phòng…</td></tr>
            : !loadError && rooms.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600">Chưa có phòng KTX nào.</td></tr>
            : !loadError && rooms.map((room) => <tr key={room.id} className="hover:bg-slate-50">
              <th scope="row" className="px-4 py-3 font-medium text-slate-900">{room.room_number}</th>
              <td className="px-4 py-3 text-slate-600">{room.capacity == null ? "Chưa khai báo" : `${room.capacity} người`}</td>
              <td className="max-w-lg break-words px-4 py-3 text-slate-600">{room.notes || "—"}</td>
              <td className="whitespace-nowrap px-4 py-2"><button type="button" onClick={() => openModal(room)} aria-label={`Sửa phòng ${room.room_number}`} className={systemTextButton}>Sửa</button>
                <button type="button" onClick={() => void handleDelete(room)} aria-label={`Xóa phòng ${room.room_number}`} className="ml-4 min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9">Xóa</button></td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <SystemDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? "Sửa phòng KTX" : "Thêm phòng KTX"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <div><label htmlFor="room-number" className="mb-1.5 block text-sm text-slate-700">Số phòng <span className="text-red-700">*</span></label>
          <input id="room-number" required value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="Ví dụ: 1601" className={systemField} /></div>
        <div><label htmlFor="room-capacity" className="mb-1.5 block text-sm text-slate-700">Sức chứa (số người)</label>
          <input id="room-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} className={systemField} /></div>
        <div><label htmlFor="room-notes" className="mb-1.5 block text-sm text-slate-700">Ghi chú</label>
          <textarea id="room-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={systemField} /></div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className={systemSecondaryButton}>Hủy</button>
          <button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Lưu phòng"}</button>
        </div>
      </form>
    </SystemDialog>
  </div>;
}
