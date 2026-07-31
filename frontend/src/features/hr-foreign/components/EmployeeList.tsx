import React, { useState, useEffect } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { getEmployeeDocStatuses } from "./employee-list/DocBadge";
import { EmployeeTable } from "./employee-list/EmployeeTable";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_VN" | "RETURNED">("ALL");
  const [workTypeFilter, setWorkTypeFilter] = useState<"ALL" | "CO_DINH" | "CONG_TAC">("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<
    "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK"
  >("ALL");
  const [thresholdDays, setThresholdDays] = useState<number>(60);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);
  const [profileEmpId, setProfileEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = async (q?: string) => {
    try {
      setLoading(true);
      const data = await fetchEmployees(q);
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(searchQuery); }, [searchQuery]);

  const handleCreateOrUpdate = async (payload: ForeignEmployeeCreate) => {
    if (editingEmp) {
      await updateEmployee(editingEmp.id, payload);
    } else {
      await createEmployee(payload);
    }
    loadData(searchQuery);
  };

  const handlePromptDelete = (emp: ForeignEmployee) => {
    setDeleteTarget(emp);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    loadData(searchQuery);
  };

  const openProfile = (emp: ForeignEmployee) => {
    setProfileEmpId(emp.id);
    setIsProfileOpen(true);
    onSelectEmployee?.(emp);
  };

  const inVnCount = employees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = employees.filter((e) => !e.is_in_vietnam).length;

  const filtered = employees.filter((emp) => {
    // Exclude janitor staff from Foreign Employees tab
    if (emp.employee_type === "JANITORIAL" || (emp.role && emp.role.toLowerCase().includes("tạp vụ"))) return false;

    if (statusFilter === "IN_VN" && !emp.is_in_vietnam) return false;
    if (statusFilter === "RETURNED" && emp.is_in_vietnam) return false;
    if (workTypeFilter !== "ALL" && (emp.work_type || "CO_DINH") !== workTypeFilter) return false;

    if (docStatusFilter !== "ALL") {
      const statuses = getEmployeeDocStatuses(emp, thresholdDays);
      if (docStatusFilter === "HAS_EXPIRED" && !statuses.includes("expired")) return false;
      if (docStatusFilter === "HAS_WARNING" && !statuses.includes("warning")) return false;
      if (docStatusFilter === "HAS_MISSING" && !statuses.includes("missing")) return false;
      if (docStatusFilter === "ALL_OK" && !statuses.every((s) => s === "ok")) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            🌐
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Quản lý Hồ sơ Nhân sự Nước ngoài</h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">Danh sách nhân sự nước ngoài công tác & lưu trú</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingEmp(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-sky-800 font-extrabold text-xs rounded-xl shadow-xs hover:bg-sky-50 cursor-pointer transition-all shrink-0"
        >
          + Thêm Hồ sơ Nhân sự
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, hộ chiếu, bộ phận..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            <option value="ALL">🏢 Tất cả loại hình</option>
            <option value="CO_DINH">🔹 Cố định</option>
            <option value="CONG_TAC">🔸 Công tác</option>
          </select>

          <select
            value={docStatusFilter}
            onChange={(e) => setDocStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            <option value="ALL">📋 Tất cả trạng thái giấy tờ</option>
            <option value="HAS_EXPIRED">🔴 Có giấy tờ HẾT HẠN</option>
            <option value="HAS_WARNING">🟡 Có giấy tờ SẮP HẾT HẠN (≤ {thresholdDays}d)</option>
            <option value="HAS_MISSING">⚪ Có giấy tờ THIẾU THÔNG TIN</option>
            <option value="ALL_OK">🟢 Tất cả giấy tờ CÒN HẠN (&gt; {thresholdDays}d)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
          >
            Tất cả ({employees.length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_VN")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${statusFilter === "IN_VN" ? "bg-emerald-600 text-white shadow-xs" : "hover:text-emerald-700"}`}
          >
            Đang ở VN ({inVnCount})
          </button>
          <button
            onClick={() => setStatusFilter("RETURNED")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${statusFilter === "RETURNED" ? "bg-rose-600 text-white shadow-xs" : "hover:text-rose-700"}`}
          >
            Đã về nước ({returnedCount})
          </button>
        </div>
      </div>

      {/* Threshold Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Mốc cảnh báo giấy tờ:</span>
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            {[15, 30, 60, 90, 120].map((days) => (
              <button
                key={days}
                onClick={() => setThresholdDays(days)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  thresholdDays === days
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ≤ {days} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Đang tải danh sách nhân sự...</div>
      ) : (
        <EmployeeTable
          filtered={filtered}
          thresholdDays={thresholdDays}
          onOpenProfile={openProfile}
          onEdit={(emp) => { setEditingEmp(emp); setIsModalOpen(true); }}
          onDelete={handlePromptDelete}
        />
      )}

      {/* Modals */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEmp(null); }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingEmp}
      />

      <EmployeeProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setProfileEmpId(null);
          loadData();
        }}
        onUpdate={loadData}
        employeeId={profileEmpId}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Nhân sự"
        employeeName={deleteTarget?.name_latin || ""}
        employeeCode={deleteTarget?.employee_code}
        passportNumber={deleteTarget?.passport_number}
        department={deleteTarget?.department}
      />
      </div>
    </div>
  );
};
