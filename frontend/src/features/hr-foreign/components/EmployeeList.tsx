import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, RotateCcw } from "lucide-react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { getEmployeeDocStatuses } from "./employee-list/DocBadge";
import { EmployeeTable } from "./employee-list/EmployeeTable";
import { EmployeeFilters, type StatusFilter, type WorkTypeFilter, type DocumentFilter } from "./employee-list/EmployeeFilters";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

export function EmployeeList({ onSelectEmployee }: EmployeeListProps) {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<DocumentFilter>("ALL");
  const [thresholdDays, setThresholdDays] = useState(60);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);
  const [profileEmpId, setProfileEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const requestSequence = useRef(0);

  const loadData = useCallback(async (q?: string): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEmployees(q);
      if (sequence === requestSequence.current) setEmployees(data);
    } catch (err: unknown) {
      if (sequence === requestSequence.current) {
        console.error("Failed to load employees:", err);
        setLoadError("Không thể tải hồ sơ nhân sự. Kiểm tra kết nối rồi thử lại.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => { void loadData(searchQuery); }, 280);
    return () => {
      window.clearTimeout(timer);
      requestSequence.current += 1;
    };
  }, [searchQuery, loadData]);

  const handleCreateOrUpdate = async (payload: ForeignEmployeeCreate): Promise<void> => {
    if (editingEmp) await updateEmployee(editingEmp.id, payload);
    else await createEmployee(payload);
    await loadData(searchQuery);
  };

  const handlePromptDelete = (emp: ForeignEmployee): void => {
    setDeleteTarget(emp);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    await loadData(searchQuery);
  };

  const openProfile = (emp: ForeignEmployee): void => {
    setProfileEmpId(emp.id);
    setIsProfileOpen(true);
    onSelectEmployee?.(emp);
  };

  const foreignEmployees = employees.filter((emp) => emp.employee_type !== "JANITORIAL" && !(emp.role && emp.role.toLowerCase().includes("tạp vụ")));
  const counts = loading || loadError ? null : {
    total: foreignEmployees.length,
    inVietnam: foreignEmployees.filter((emp) => emp.is_in_vietnam).length,
    returned: foreignEmployees.filter((emp) => !emp.is_in_vietnam).length,
    attention: foreignEmployees.filter((emp) => getEmployeeDocStatuses(emp, thresholdDays).some((status) => status === "expired" || status === "warning")).length,
  };
  const filtered = foreignEmployees.filter((emp) => {
    if (statusFilter === "IN_VN" && !emp.is_in_vietnam) return false;
    if (statusFilter === "RETURNED" && emp.is_in_vietnam) return false;
    if (workTypeFilter !== "ALL" && (emp.work_type || "CO_DINH") !== workTypeFilter) return false;
    if (docStatusFilter !== "ALL") {
      const statuses = getEmployeeDocStatuses(emp, thresholdDays);
      if (docStatusFilter === "HAS_ATTENTION" && !statuses.some((status) => status === "expired" || status === "warning")) return false;
      if (docStatusFilter === "HAS_EXPIRED" && !statuses.includes("expired")) return false;
      if (docStatusFilter === "HAS_WARNING" && !statuses.includes("warning")) return false;
      if (docStatusFilter === "HAS_MISSING" && !statuses.includes("missing")) return false;
      if (docStatusFilter === "ALL_OK" && !statuses.every((status) => status === "ok")) return false;
    }
    return true;
  });

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Hồ sơ nhân sự nước ngoài</h1>
      <button type="button" onClick={() => { setEditingEmp(null); setIsModalOpen(true); }}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:min-h-9">
        <Plus className="h-4 w-4" aria-hidden="true" /> Thêm nhân sự
      </button>
    </div>
    <EmployeeFilters searchQuery={searchQuery} onSearch={setSearchQuery} statusFilter={statusFilter} onStatus={setStatusFilter}
      workTypeFilter={workTypeFilter} onWorkType={setWorkTypeFilter} docStatusFilter={docStatusFilter} onDocument={setDocStatusFilter}
      thresholdDays={thresholdDays} onThreshold={setThresholdDays} counts={counts} />
    <div aria-busy={loading}>
      {loading ? <div role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải danh sách nhân sự…</div>
        : loadError ? <div className="rounded-sm border border-red-200 bg-white p-5 text-sm" role="alert">
          <p className="font-semibold text-red-800">Không thể tải danh sách nhân sự</p>
          <p className="mt-1 text-slate-600">{loadError}</p>
          <button type="button" onClick={() => void loadData(searchQuery)} className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Thử lại
          </button>
        </div> : <EmployeeTable filtered={filtered} thresholdDays={thresholdDays} onOpenProfile={openProfile}
          onEdit={(emp) => { setEditingEmp(emp); setIsModalOpen(true); }} onDelete={handlePromptDelete} />}
    </div>
    <EmployeeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEmp(null); }} onSubmit={handleCreateOrUpdate} initialData={editingEmp} />
    <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => { setIsProfileOpen(false); setProfileEmpId(null); void loadData(searchQuery); }}
      onUpdate={() => loadData(searchQuery)} employeeId={profileEmpId} />
    <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }} onConfirm={handleConfirmDelete}
      title="Xác nhận xóa Nhân sự" employeeName={deleteTarget?.name_latin || ""} employeeCode={deleteTarget?.employee_code}
      passportNumber={deleteTarget?.passport_number} department={deleteTarget?.department} />
  </div>;
}
