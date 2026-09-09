import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, RotateCcw } from "lucide-react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { getEmployeeDocStatuses } from "./employee-list/DocBadge";
import { EmployeeTable } from "./employee-list/EmployeeTable";
import { EmployeeStatCards } from "./employee-list/EmployeeStatCards";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

type StatusFilter = "ALL" | "IN_VN" | "RETURNED";
type WorkTypeFilter = "ALL" | "CO_DINH" | "CONG_TAC";
type DocumentFilter = "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK";

export const EmployeeList: React.FC<EmployeeListProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<DocumentFilter>("ALL");
  const [thresholdDays, setThresholdDays] = useState<number>(60);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);
  const [profileEmpId, setProfileEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = useCallback(async (q?: string): Promise<void> => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await fetchEmployees(q);
      setEmployees(data);
    } catch (err: unknown) {
      console.error("Failed to load employees:", err);
      setLoadError("Không thể tải hồ sơ nhân sự. Kiểm tra kết nối rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(searchQuery);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery, loadData]);

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

  // Filter out janitorial staff to get only foreign employees
  const foreignEmployees = employees.filter(
    (emp) =>
      emp.employee_type !== "JANITORIAL" &&
      !(emp.role && emp.role.toLowerCase().includes("tạp vụ"))
  );

  const inVnCount = foreignEmployees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = foreignEmployees.filter((e) => !e.is_in_vietnam).length;

  const filtered = foreignEmployees.filter((emp) => {
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
    <div className="space-y-6">
      <ModuleHeader
        title="Hồ sơ nhân sự nước ngoài"
        subtitle="Quản lý tập trung hồ sơ nhân sự, tình trạng hiện diện lưu trú và hạn giấy tờ pháp lý."
        icon={Users}
        theme="indigo"
        badgeText={`${foreignEmployees.length} Nhân sự`}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingEmp(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all duration-200 hover:bg-slate-100 hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-indigo-600" />
            <span>Thêm nhân sự mới</span>
          </button>
        }
      />

      {/* Interactive Stat Cards */}
      {!loading && !loadError && (
        <EmployeeStatCards
          employees={foreignEmployees}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          docStatusFilter={docStatusFilter}
          setDocStatusFilter={setDocStatusFilter}
          thresholdDays={thresholdDays}
        />
      )}

      {/* Modern Filter Toolbar */}
      <div className="modern-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <label className="sr-only" htmlFor="employee-search">
                Tìm hồ sơ nhân sự
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="employee-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, hộ chiếu, bộ phận..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value as WorkTypeFilter)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">Tất cả loại hình</option>
              <option value="CO_DINH">Cố định</option>
              <option value="CONG_TAC">Công tác</option>
            </select>

            <select
              value={docStatusFilter}
              onChange={(e) => setDocStatusFilter(e.target.value as DocumentFilter)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">Tất cả trạng thái giấy tờ</option>
              <option value="HAS_EXPIRED">Có giấy tờ hết hạn</option>
              <option value="HAS_WARNING">Sắp hết hạn (≤ {thresholdDays} ngày)</option>
              <option value="HAS_MISSING">Thiếu thông tin</option>
              <option value="ALL_OK">Tất cả còn hạn (&gt; {thresholdDays} ngày)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Tất cả ({foreignEmployees.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IN_VN")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                statusFilter === "IN_VN"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "hover:text-emerald-700"
              }`}
            >
              Đang ở VN ({inVnCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("RETURNED")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                statusFilter === "RETURNED"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "hover:text-rose-700"
              }`}
            >
              Đã về nước ({returnedCount})
            </button>
          </div>
        </div>

        {/* Threshold Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600">Mốc cảnh báo giấy tờ:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {[15, 30, 60, 90, 120].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setThresholdDays(days)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    thresholdDays === days
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ≤ {days} ngày
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 pt-4" aria-label="Đang tải danh sách nhân sự">
            <div className="workspace-skeleton h-12 w-full" />
            <div className="workspace-skeleton h-12 w-full" />
            <div className="workspace-skeleton h-12 w-full" />
          </div>
        ) : loadError ? (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"
            role="alert"
          >
            <p className="font-semibold">Không thể tải danh sách nhân sự</p>
            <p className="mt-1 text-xs text-rose-800">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadData(searchQuery)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : (
          <EmployeeTable
            filtered={filtered}
            thresholdDays={thresholdDays}
            onOpenProfile={openProfile}
            onEdit={(emp) => {
              setEditingEmp(emp);
              setIsModalOpen(true);
            }}
            onDelete={handlePromptDelete}
          />
        )}
      </div>

      {/* Modals */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmp(null);
        }}
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
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Nhân sự"
        employeeName={deleteTarget?.name_latin || ""}
        employeeCode={deleteTarget?.employee_code}
        passportNumber={deleteTarget?.passport_number}
        department={deleteTarget?.department}
      />
    </div>
  );
};
