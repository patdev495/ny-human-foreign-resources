import React from "react";
import type {
  OwnershipGroup,
  Vehicle,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
} from "../../types";

interface DispatchModalProps {
  isOpen: boolean;
  editingDispatch: VehicleDispatch | null;
  formData: VehicleDispatchCreatePayload;
  setFormData: React.Dispatch<React.SetStateAction<VehicleDispatchCreatePayload>>;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicleIdStr: string) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  editingDispatch,
  formData,
  setFormData,
  vehicles,
  onVehicleSelect,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
          {editingDispatch ? "Chỉnh sửa Bản ghi Điều xe" : "Tạo Đơn Điều xe mới"}
        </h3>

        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày điều xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dispatch_date}
                onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giờ đón</label>
              <input
                type="time"
                value={formData.pickup_time || ""}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn loại xe từ Danh sách xe
            </label>
            <select
              value={formData.vehicle_id || ""}
              onChange={(e) => onVehicleSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn xe gợi ý --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.ownership_group === "COMPANY_OWNED" ? "[Công ty]" : "[Thuê ngoài]"} {v.name}{" "}
                  {v.driver_name ? `- TX: ${v.driver_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Xe / Loại xe <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vehicle_name}
                onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                placeholder="VD: A Ngọc, Xe 7 chỗ..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm sở hữu</label>
              <select
                value={formData.ownership_group}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownership_group: e.target.value as OwnershipGroup,
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="COMPANY_OWNED">🏢 Xe công ty</option>
                <option value="OUTSOURCED">🚕 Xe thuê ngoài</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tài xế</label>
              <input
                type="text"
                value={formData.driver_name || ""}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                placeholder="Tên tài xế"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Biển số xe</label>
              <input
                type="text"
                value={formData.license_plate || ""}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                placeholder="Biển số"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm đi (Pickup) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickup_location || ""}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                placeholder="VD: KTX Nhà máy, Sân bay Nội Bài..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm đến (Dropoff) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dropoff_location || ""}
                onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                placeholder="VD: Khách sạn Mường Thanh, Công ty..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Hành khách / Nhân sự</label>
              <input
                type="text"
                value={formData.passenger_name || ""}
                onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                placeholder="VD: WANG LEI, Đoàn chuyên gia..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số hành khách</label>
              <input
                type="number"
                min="1"
                value={formData.passenger_count}
                onChange={(e) =>
                  setFormData({ ...formData, passenger_count: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chi phí thực tế (VNĐ) <span className="text-slate-400 font-normal">(Sửa thoải mái)</span>
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 text-xs font-bold text-emerald-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú chuyến đi</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhập ghi chú thêm..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {editingDispatch ? "Cập nhật" : "Lưu chuyến đi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
