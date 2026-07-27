import React from "react";
import type { ForeignEmployee } from "../../types";

interface JanitorFormData {
  name_latin: string;
  employee_code: string;
  workplace_location: string;
  salary: number;
  salary_unit: string;
  role: string;
  notes: string;
}

interface JanitorModalProps {
  isOpen: boolean;
  editingJanitor: ForeignEmployee | null;
  formData: JanitorFormData;
  setFormData: React.Dispatch<React.SetStateAction<JanitorFormData>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const JanitorModal: React.FC<JanitorModalProps> = ({
  isOpen,
  editingJanitor,
  formData,
  setFormData,
  submitting,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
          {editingJanitor ? "Chỉnh sửa Nhân viên Tạp vụ" : "Thêm Nhân viên Tạp vụ Mới"}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ và tên nhân viên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name_latin}
              onChange={(e) => setFormData({ ...formData, name_latin: e.target.value })}
              placeholder="VD: Nguyễn Thị Hoa"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã nhân viên (nếu có)</label>
              <input
                type="text"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="VD: TV001"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nơi làm việc <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.workplace_location}
                onChange={(e) => setFormData({ ...formData, workplace_location: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="DORMITORY">🏫 KTX (Tính tiền ăn KTX)</option>
                <option value="CN09">🏭 Nhà máy CN09</option>
                <option value="CN15">🏭 Nhà máy CN15</option>
                <option value="COMPANY">🏢 Văn phòng Công ty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mức lương</label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị tính lương</label>
              <select
                value={formData.salary_unit}
                onChange={(e) => setFormData({ ...formData, salary_unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="MONTH">VNĐ / Tháng</option>
                <option value="DAY">VNĐ / Ngày công</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chức danh / Mô tả công việc</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="VD: Tạp vụ KTX, Vệ sinh xưởng..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú thêm thông tin..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : editingJanitor ? "Cập nhật" : "Lưu Nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
