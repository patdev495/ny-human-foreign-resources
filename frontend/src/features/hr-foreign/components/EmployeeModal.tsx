import React, { useState, useEffect, useRef } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";


interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ForeignEmployeeCreate) => Promise<void>;
  initialData?: ForeignEmployee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<ForeignEmployeeCreate>({
    employee_code: "",
    name_latin: "",
    name_chinese: "",
    gender: "Nam",
    nationality: "",
    date_of_birth: "",
    passport_number: "",
    passport_expiry: "",
    phone: "",
    department: "",
    role: "",
    work_type: "CO_DINH",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee_code: initialData.employee_code || "",
        name_latin: initialData.name_latin || "",
        name_chinese: initialData.name_chinese || "",
        gender: initialData.gender || "Nam",
        nationality: initialData.nationality || "",
        date_of_birth: initialData.date_of_birth || "",
        passport_number: initialData.passport_number || "",
        passport_expiry: initialData.passport_expiry || "",
        phone: initialData.phone || "",
        department: initialData.department || "",
        role: initialData.role || "",
        work_type: initialData.work_type || "CO_DINH",
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        employee_code: "",
        name_latin: "",
        name_chinese: "",
        gender: "Nam",
        nationality: "",
        date_of_birth: "",
        passport_number: "",
        passport_expiry: "",
        phone: "",
        department: "",
        role: "",
        work_type: "CO_DINH",
        notes: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (isOpen) nameInputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name_latin.trim()) {
      setError("Vui lòng nhập Tên Latin.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        employee_code: formData.employee_code?.trim() || null,
        name_chinese: formData.name_chinese?.trim() || null,
        nationality: formData.nationality?.trim() || null,
        passport_number: formData.passport_number?.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        passport_expiry: formData.passport_expiry || null,
        phone: formData.phone?.trim() || null,
        department: formData.department?.trim() || null,
        role: formData.role?.trim() || null,
        notes: formData.notes?.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" role="presentation">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 id="employee-modal-title" className="text-lg font-semibold text-slate-800">
            {initialData ? "Chỉnh sửa Hồ sơ Nhân sự" : "Thêm Hồ sơ Nhân sự Nước ngoài"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng form hồ sơ nhân sự"
            className="min-w-11 min-h-11 text-slate-400 hover:text-slate-600 text-xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
            <span>✈️</span>
            <span>
              Lịch trình Nhập xuất cảnh (Ngày đến, Ngày dự kiến, Ngày về) được quản lý và cập nhật tập trung tại tab <strong>"Nhật ký Nhập xuất cảnh"</strong>.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên</label>
              <input
                ref={nameInputRef}
                id="employee-name-latin"
                type="text"
                value={formData.employee_code || ""}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="VD: NV001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label htmlFor="employee-name-latin" className="block text-sm font-medium text-slate-700 mb-1">
                Tên Latin <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name_latin}
                onChange={(e) => setFormData({ ...formData, name_latin: e.target.value })}
                placeholder="VD: NGUYEN VAN A / LI WEI"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên Trung Quốc</label>
              <input
                type="text"
                value={formData.name_chinese || ""}
                onChange={(e) => setFormData({ ...formData, name_chinese: e.target.value })}
                placeholder="VD: 李伟"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quốc tịch</label>
              <input
                type="text"
                value={formData.nationality || ""}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="VD: Trung Quốc"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bộ phận</label>
              <input
                type="text"
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="VD: Quản lý / Kỹ thuật"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chức danh / Vai trò</label>
              <input
                type="text"
                value={formData.role || ""}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="VD: Chuyên gia kỹ thuật"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình làm việc</label>
              <select
                value={formData.work_type || "CO_DINH"}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium"
              >
                <option value="CO_DINH">Cố định</option>
                <option value="CONG_TAC">Công tác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
            />
          </div>


          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : initialData ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
