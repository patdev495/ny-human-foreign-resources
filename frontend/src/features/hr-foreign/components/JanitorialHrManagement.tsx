import React, { useEffect, useMemo, useState } from "react";
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from "../api";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { JanitorModal } from "./janitorial/JanitorModal";
import { JanitorStatCards } from "./janitorial/JanitorStatCards";
import { JanitorTable } from "./janitorial/JanitorTable";

export const JanitorialHrManagement: React.FC = () => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("WORKING");
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
    salary_unit: "MONTH",
    role: "Tạp vụ",
    status: "WORKING",
    resignation_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadJanitors = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchEmployees();
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
      status: "WORKING",
      resignation_date: "",
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
      status: j.status || "WORKING",
      resignation_date: j.resignation_date || "",
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
        status: formData.status,
        resignation_date: formData.status === "RESIGNED" && formData.resignation_date ? formData.resignation_date : null,
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
      if (statusFilter !== "ALL") {
        const st = j.status || "WORKING";
        if (st !== statusFilter) return false;
      }
      return true;
    });
  }, [employees, searchQuery, locationFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl text-xl shadow-xs">🧹</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự Tạp vụ</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý hồ sơ nhân viên tạp vụ nội địa, nơi làm việc (KTX, CN09, CN15) và mức lương tháng/ngày.
            </p>
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

      <JanitorStatCards employees={employees} />

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã NV..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
            >
              <option value="WORKING">✅ Đang làm việc</option>
              <option value="RESIGNED">🛑 Đã nghỉ việc</option>
              <option value="ALL">Tất cả trạng thái</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Lọc nơi làm việc:</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Tất cả vị trí</option>
              <option value="DORMITORY">🏫 KTX (Ký túc xá)</option>
              <option value="CN09">🏭 Nhà máy CN09</option>
              <option value="CN15">🏭 Nhà máy CN15</option>
              <option value="COMPANY">🏢 Văn phòng Công ty</option>
            </select>
          </div>
        </div>
      </div>

      <JanitorTable
        janitors={filteredJanitors}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handlePromptDelete}
      />

      <JanitorModal
        isOpen={isModalOpen}
        editingJanitor={editingJanitor}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Xóa Nhân viên Tạp vụ"
        employeeName={deleteTarget?.name_latin || ""}
        employeeCode={deleteTarget?.employee_code}
        department="Nhân sự Tạp vụ"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />

    </div>
  );
};
