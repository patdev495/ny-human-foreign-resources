import React, { useState, useEffect, useMemo } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

export const JanitorialHrManagement: React.FC = () => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJanitor, setEditingJanitor] = useState<ForeignEmployee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_latin: "",
    employee_code: "",
    workplace_location: "DORMITORY",
    salary: 8500000,
    salary_unit: "MONTH", // "MONTH" | "DAY"
    role: "Tạp vụ",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadJanitors = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchEmployees();
      // Filter janitor staff: employee_type === 'JANITORIAL' or role contains 'tạp vụ'
      const janitorsOnly = data.filter(
        (e) => e.employee_type === "JANITORIAL" || (e.role && e.role.toLowerCase().includes("tạp vụ"))
      );
      setEmployees(janitorsOnly);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải danh sách nhân sự tạp vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJanitors();
  }, []);

  const handleOpenAddModal = () => {
    setEditingJanitor(null);
    setFormData({
      name_latin: "",
      employee_code: "",
      workplace_location: "DORMITORY",
      salary: 8500000,
      salary_unit: "MONTH",
      role: "Tạp vụ KTX",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (j: ForeignEmployee) => {
    setEditingJanitor(j);
    setFormData({
      name_latin: j.name_latin || "",
      employee_code: j.employee_code || "",
      workplace_location: j.workplace_location || "DORMITORY",
      salary: j.salary ?? 8500000,
      salary_unit: j.salary_unit || (j.salary && j.salary < 1000000 ? "DAY" : "MONTH"),
      role: j.role || "Tạp vụ",
      notes: j.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_latin.trim()) {
      alert("Vui lòng nhập Họ và tên nhân viên tạp vụ.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: ForeignEmployeeCreate = {
        name_latin: formData.name_latin.trim(),
        employee_code: formData.employee_code.trim() || null,
        gender: "Nữ",
        nationality: "Việt Nam",
        department: "Nhân Sự/管理课",
        role: formData.role.trim() || "Tạp vụ",
        work_type: "CO_DINH",
        workplace_location: formData.workplace_location,
        salary: formData.salary ? Number(formData.salary) : null,
        salary_unit: formData.salary_unit,
        employee_type: "JANITORIAL",
        notes: formData.notes.trim() || null,
      };

      if (editingJanitor) {
        await updateEmployee(editingJanitor.id, payload);
      } else {
        await createEmployee(payload);
      }
      setIsModalOpen(false);
      loadJanitors();
    } catch (err: any) {
      alert(err.message || "Không thể lưu thông tin nhân sự tạp vụ");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromptDelete = (j: ForeignEmployee) => {
    setDeleteTarget(j);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      loadJanitors();
    } catch (err: any) {
      alert(err.message || "Không thể xóa nhân sự tạp vụ");
    }
  };

  // Filtering
  const filteredJanitors = useMemo(() => {
    return employees.filter((j) => {
      if (
        searchQuery &&
        !j.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(j.name_chinese && j.name_chinese.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !(j.employee_code && j.employee_code.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }
      if (locationFilter !== "ALL" && (j.workplace_location || "DORMITORY") !== locationFilter) {
        return false;
      }
      return true;
    });
  }, [employees, searchQuery, locationFilter]);

  // Statistics
  const countKTX = employees.filter((e) => (e.workplace_location || "DORMITORY") === "DORMITORY").length;
  const countCN09 = employees.filter((e) => e.workplace_location === "CN09").length;
  const countCN15 = employees.filter((e) => e.workplace_location === "CN15").length;
  const countCompany = employees.filter((e) => e.workplace_location === "COMPANY").length;

  const getLocationBadge = (loc?: string | null) => {
    switch (loc) {
      case "DORMITORY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            🏫 KTX (Ký túc xá)
          </span>
        );
      case "CN09":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
            🏭 Nhà máy CN09
          </span>
        );
      case "CN15":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 inline-flex items-center gap-1">
            🏭 Nhà máy CN15
          </span>
        );
      case "COMPANY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            🏢 Văn phòng Công ty
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {loc || "KTX"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl text-xl shadow-xs">🧹</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự Tạp vụ</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý hồ sơ nhân viên tạp vụ nội địa, nơi làm việc (KTX, CN09, CN15) và mức lương tháng/ngày.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>Thêm Nhân viên Tạp vụ</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng Tạp vụ</span>
          <span className="text-2xl font-extrabold text-slate-800 font-mono">{employees.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Nhân sự hiện có</span>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-xs font-semibold text-amber-800 block mb-1">Tạp vụ KTX</span>
          <span className="text-2xl font-extrabold text-amber-900 font-mono">{countKTX}</span>
          <span className="text-[10px] text-amber-700 block mt-0.5">Được tính tiền ăn KTX</span>
        </div>
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-xs font-semibold text-blue-800 block mb-1">Tạp vụ CN09</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono">{countCN09}</span>
          <span className="text-[10px] text-blue-700 block mt-0.5">Nhà máy CN09</span>
        </div>
        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-xs font-semibold text-indigo-800 block mb-1">Tạp vụ CN15</span>
          <span className="text-2xl font-extrabold text-indigo-900 font-mono">{countCN15}</span>
          <span className="text-[10px] text-indigo-700 block mt-0.5">Nhà máy CN15</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã NV..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Nơi làm việc:</span>
          <button
            onClick={() => setLocationFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              locationFilter === "ALL"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả ({employees.length})
          </button>
          <button
            onClick={() => setLocationFilter("DORMITORY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              locationFilter === "DORMITORY"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            🏫 KTX ({countKTX})
          </button>
          <button
            onClick={() => setLocationFilter("CN09")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              locationFilter === "CN09"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
            }`}
          >
            🏭 CN09 ({countCN09})
          </button>
          <button
            onClick={() => setLocationFilter("CN15")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              locationFilter === "CN15"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            🏭 CN15 ({countCN15})
          </button>
          <button
            onClick={() => setLocationFilter("COMPANY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              locationFilter === "COMPANY"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            🏢 Công ty ({countCompany})
          </button>
        </div>
      </div>

      {/* Janitors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Chức danh / Vai trò</th>
                <th className="py-3 px-4">Nơi làm việc</th>
                <th className="py-3 px-4">Mức lương</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ⏳ Đang tải dữ liệu nhân sự tạp vụ...
                  </td>
                </tr>
              ) : filteredJanitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Chưa có dữ liệu nhân sự tạp vụ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredJanitors.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {j.employee_code || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{j.name_latin}</span>
                      {j.name_chinese && (
                        <span className="text-[11px] text-slate-400 block">{j.name_chinese}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{j.role || "Tạp vụ"}</td>
                    <td className="py-3.5 px-4">{getLocationBadge(j.workplace_location)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {j.salary
                        ? (j.salary_unit || (j.salary < 1000000 ? "DAY" : "MONTH")) === "DAY"
                          ? `${j.salary.toLocaleString("vi-VN")} VNĐ / ngày công`
                          : `${j.salary.toLocaleString("vi-VN")} VNĐ / tháng`
                        : "Chưa cài đặt"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {j.notes || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(j)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handlePromptDelete(j)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JANITOR ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🧹</span>
                <span>{editingJanitor ? "Chỉnh sửa Nhân sự Tạp vụ" : "Thêm mới Nhân sự Tạp vụ"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name_latin}
                  onChange={(e) => setFormData({ ...formData, name_latin: e.target.value })}
                  placeholder="VD: Đỗ Thị Lan / Vũ Thị Oanh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Nhân viên</label>
                <input
                  type="text"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  placeholder="VD: NYV2007077 (Tùy chọn)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nơi làm việc</label>
                <select
                  value={formData.workplace_location}
                  onChange={(e) => setFormData({ ...formData, workplace_location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium bg-white"
                >
                  <option value="DORMITORY">🏫 KTX (Ký túc xá) — Tính tiền ăn KTX</option>
                  <option value="CN09">🏭 Nhà máy CN09</option>
                  <option value="CN15">🏭 Nhà máy CN15</option>
                  <option value="COMPANY">🏢 Văn phòng Công ty</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chức danh / Mô tả</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="VD: Tạp vụ KTX / Tạp vụ thuê ngoài"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mức lương (VNĐ)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    placeholder="VD: 8500000"
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono bg-white"
                  />
                  <select
                    value={formData.salary_unit}
                    onChange={(e) => setFormData({ ...formData, salary_unit: e.target.value })}
                    className="px-2 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs cursor-pointer"
                  >
                    <option value="MONTH">🗓️ / Tháng</option>
                    <option value="DAY">📅 / Ngày công</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Chọn <strong>/ Tháng</strong> đối với lương cố định tháng hoặc <strong>/ Ngày công</strong> nếu tính theo từng ngày làm việc.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm về hợp đồng, ca làm việc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : editingJanitor ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Xóa Nhân sự Tạp vụ"
        employeeName={deleteTarget?.name_latin || ""}
        employeeCode={deleteTarget?.employee_code}
        warningMessage={`Bạn có chắc chắn muốn xóa nhân sự tạp vụ "${deleteTarget?.name_latin}" khỏi hệ thống?`}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
