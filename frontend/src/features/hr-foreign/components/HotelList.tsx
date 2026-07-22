import React, { useEffect, useState } from "react";
import { fetchHotels, createHotel, updateHotel, deleteHotel } from "../api";
import type { Hotel } from "../types";

export const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    notes: "",
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHotels();
      setHotels(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleOpenAdd = () => {
    setEditingHotel(null);
    setFormData({ name: "", address: "", phone: "", notes: "" });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address || "",
      phone: hotel.phone || "",
      notes: hotel.notes || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (hotel: Hotel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách sạn "${hotel.name}"?`)) return;
    try {
      await deleteHotel(hotel.id);
      await loadHotels();
    } catch (err: any) {
      alert(err.message || "Không thể xóa khách sạn");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Vui lòng nhập tên khách sạn");
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      if (editingHotel) {
        await updateHotel(editingHotel.id, {
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await createHotel({
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await loadHotels();
    } catch (err: any) {
      setModalError(err.message || "Đã xảy ra lỗi khi lưu khách sạn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh mục Khách sạn đối tác</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các cơ sở khách sạn phục vụ nhân viên nước ngoài lưu trú công tác ngắn hạn.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm khách sạn
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">Đang tải danh sách khách sạn...</div>
      ) : hotels.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          Chưa có khách sạn nào trong danh mục. Nhấn "Thêm khách sạn" để tạo mới.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tên khách sạn</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{h.name}</td>
                  <td className="py-3 px-4 text-slate-600">{h.address || "—"}</td>
                  <td className="py-3 px-4 text-slate-600">{h.phone || "—"}</td>
                  <td className="py-3 px-4 text-slate-500">{h.notes || "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(h)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(h)}
                      className="text-rose-600 hover:text-rose-900 font-medium"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingHotel ? "Chỉnh sửa thông tin Khách sạn" : "Thêm Khách sạn mới"}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tên khách sạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Khách sạn Mường Thanh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  placeholder="Địa chỉ khách sạn..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  placeholder="SĐT lễ tân / quản lý..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
