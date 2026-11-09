import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { fetchHotels, createHotel, updateHotel, deleteHotel } from "../api";
import type { Hotel } from "../types";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";

export function HotelList() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({ name: "", address: "", phone: "", notes: "" });
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHotels = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try { setHotels(await fetchHotels()); }
    catch { setError("Không thể tải danh mục khách sạn. Kiểm tra kết nối rồi thử lại."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadHotels(); }, [loadHotels]);

  const openModal = (hotel?: Hotel): void => {
    setEditingHotel(hotel ?? null);
    setFormData({ name: hotel?.name || "", address: hotel?.address || "", phone: hotel?.phone || "", notes: hotel?.notes || "" });
    setModalError(null);
    setIsModalOpen(true);
  };
  const handleDelete = async (hotel: Hotel): Promise<void> => {
    if (!window.confirm(`Bạn có chắc muốn xóa khách sạn "${hotel.name}"?`)) return;
    try { await deleteHotel(hotel.id); await loadHotels(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Không thể xóa khách sạn."); }
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!formData.name.trim()) { setModalError("Vui lòng nhập tên khách sạn."); return; }
    setSubmitting(true);
    setModalError(null);
    try {
      const payload = { name: formData.name.trim(), address: formData.address.trim() || undefined, phone: formData.phone.trim() || undefined, notes: formData.notes.trim() || undefined };
      if (editingHotel) await updateHotel(editingHotel.id, payload);
      else await createHotel(payload);
      setIsModalOpen(false);
      await loadHotels();
    } catch (cause: unknown) { setModalError(cause instanceof Error ? cause.message : "Không thể lưu khách sạn."); }
    finally { setSubmitting(false); }
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">Danh mục khách sạn đối tác <span className="font-normal text-slate-600">({loading || error ? "—" : hotels.length})</span></h2>
      <button type="button" onClick={() => openModal()} className={systemPrimaryButton}><Plus className="h-4 w-4" aria-hidden="true" /> Thêm khách sạn</button>
    </div>
    {error && <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm text-red-800">{error}<button type="button" onClick={() => void loadHotels()} className={`${systemSecondaryButton} ml-3`}>Thử lại</button></div>}
    <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white" role="region" aria-label="Danh mục khách sạn" tabIndex={0}>
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">Danh mục khách sạn đối tác</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Tên khách sạn", "Địa chỉ", "Điện thoại", "Ghi chú", "Thao tác"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600">Đang tải danh sách khách sạn…</td></tr>
            : !error && hotels.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600">Chưa có khách sạn nào.</td></tr>
            : !error && hotels.map((hotel) => <tr key={hotel.id} className="hover:bg-slate-50">
              <th scope="row" className="px-4 py-3 font-medium text-slate-900">{hotel.name}</th>
              <td className="max-w-sm break-words px-4 py-3 text-slate-600">{hotel.address || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{hotel.phone || "—"}</td>
              <td className="max-w-sm break-words px-4 py-3 text-slate-600">{hotel.notes || "—"}</td>
              <td className="whitespace-nowrap px-4 py-2"><button type="button" onClick={() => openModal(hotel)} aria-label={`Sửa ${hotel.name}`} className={systemTextButton}>Sửa</button>
                <button type="button" onClick={() => void handleDelete(hotel)} aria-label={`Xóa ${hotel.name}`} className="ml-4 min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9">Xóa</button></td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <SystemDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHotel ? "Sửa khách sạn" : "Thêm khách sạn"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {modalError && <p role="alert" className="text-sm text-red-800">{modalError}</p>}
        <div><label htmlFor="hotel-name" className="mb-1.5 block text-sm text-slate-700">Tên khách sạn <span className="text-red-700">*</span></label>
          <input id="hotel-name" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className={systemField} /></div>
        <div><label htmlFor="hotel-address" className="mb-1.5 block text-sm text-slate-700">Địa chỉ</label>
          <input id="hotel-address" value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} className={systemField} /></div>
        <div><label htmlFor="hotel-phone" className="mb-1.5 block text-sm text-slate-700">Điện thoại</label>
          <input id="hotel-phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className={systemField} /></div>
        <div><label htmlFor="hotel-notes" className="mb-1.5 block text-sm text-slate-700">Ghi chú</label>
          <textarea id="hotel-notes" rows={3} value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className={systemField} /></div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className={systemSecondaryButton}>Hủy</button>
          <button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Lưu khách sạn"}</button>
        </div>
      </form>
    </SystemDialog>
  </div>;
}
