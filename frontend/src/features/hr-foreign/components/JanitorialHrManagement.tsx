import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from "../api";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { JanitorModal } from "./janitorial/JanitorModal";
import { JanitorTable } from "./janitorial/JanitorTable";
import { defaultJanitorForm, isJanitor, janitorLocations, type JanitorFormData, type JanitorLocationFilter, type JanitorEmploymentFilter } from "./janitorial/janitorUtils";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";

export function JanitorialHrManagement() {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<JanitorLocationFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<JanitorEmploymentFilter>("WORKING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJanitor, setEditingJanitor] = useState<ForeignEmployee | null>(null);
  const [formData, setFormData] = useState<JanitorFormData>(defaultJanitorForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const loadJanitors = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setErrorMessage(null);
    try {
      const people = await fetchEmployees();
      if (sequence === requestSequence.current) setEmployees(people.filter(isJanitor));
    } catch {
      if (sequence === requestSequence.current) setErrorMessage("Không thể tải hồ sơ tạp vụ. Kiểm tra kết nối rồi thử lại.");
    } finally { if (sequence === requestSequence.current) setLoading(false); }
  }, []);
  useEffect(() => { void loadJanitors(); return () => { requestSequence.current += 1; }; }, [loadJanitors]);

  const openModal = (employee?: ForeignEmployee): void => {
    setEditingJanitor(employee ?? null);
    setFormError(null);
    setFormData(employee ? {
      name_latin: employee.name_latin || "", employee_code: employee.employee_code || "", workplace_location: employee.workplace_location || "DORMITORY",
      salary: employee.salary ?? 8500000, salary_unit: employee.salary_unit || (employee.salary && employee.salary < 1000000 ? "DAY" : "MONTH"),
      role: employee.role || "Tạp vụ", status: employee.status || "WORKING", resignation_date: employee.resignation_date || "", notes: employee.notes || "",
    } : defaultJanitorForm());
    setIsModalOpen(true);
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!formData.name_latin.trim()) { setFormError("Vui lòng nhập họ và tên tạp vụ."); return; }
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: ForeignEmployeeCreate = {
        name_latin: formData.name_latin.trim(), employee_code: formData.employee_code.trim() || null,
        gender: "Nữ", nationality: "Việt Nam", department: "Nhân Sự/管理课", role: formData.role.trim() || "Tạp vụ", work_type: "CO_DINH",
        workplace_location: formData.workplace_location, salary: formData.salary ? Number(formData.salary) : null,
        salary_unit: formData.salary_unit, employee_type: "JANITORIAL", status: formData.status,
        resignation_date: formData.status === "RESIGNED" && formData.resignation_date ? formData.resignation_date : null,
        notes: formData.notes.trim() || null,
      };
      if (editingJanitor) await updateEmployee(editingJanitor.id, payload);
      else await createEmployee(payload);
      setIsModalOpen(false);
      await loadJanitors();
    } catch (cause: unknown) { setFormError(cause instanceof Error ? cause.message : "Không thể lưu hồ sơ tạp vụ."); }
    finally { setSubmitting(false); }
  };
  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try { await deleteEmployee(deleteTarget.id); setDeleteTarget(null); await loadJanitors(); }
    catch (cause: unknown) { setDeleteError(cause instanceof Error ? cause.message : "Không thể xóa hồ sơ tạp vụ."); }
    finally { setDeleting(false); }
  };
  const statusEmployees = employees.filter((employee) => statusFilter === "ALL" || (employee.status || "WORKING") === statusFilter);
  const filteredJanitors = statusEmployees.filter((employee) => {
    if (locationFilter !== "ALL" && (employee.workplace_location || "DORMITORY") !== locationFilter) return false;
    const query = searchQuery.trim().toLocaleLowerCase();
    return !query || [employee.name_latin, employee.name_chinese, employee.employee_code].some((value) => value?.toLocaleLowerCase().includes(query));
  });
  const ready = !loading && !errorMessage;

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Hồ sơ nhân sự tạp vụ</h1>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadJanitors()} disabled={loading} className={systemSecondaryButton}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới</button>
        <button type="button" onClick={() => openModal()} className={systemPrimaryButton}><Plus className="h-4 w-4" aria-hidden="true" /> Thêm tạp vụ</button></div>
    </div>
    <section className="rounded-sm border border-slate-200 bg-white" aria-label="Tìm kiếm và lọc tạp vụ">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1 basis-64"><label htmlFor="janitor-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
          <input id="janitor-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tên, mã nhân sự…" className={systemField} /></div>
        <div className="w-full sm:w-48"><label htmlFor="janitor-employment" className="mb-1.5 block text-sm text-slate-600">Trạng thái làm việc</label>
          <select id="janitor-employment" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as JanitorEmploymentFilter)} className={systemField}>
            <option value="WORKING">Đang làm việc</option><option value="RESIGNED">Đã nghỉ việc</option><option value="ALL">Tất cả trạng thái</option>
          </select></div>
        {(searchQuery || locationFilter !== "ALL" || statusFilter !== "WORKING") && <button type="button" onClick={() => { setSearchQuery(""); setLocationFilter("ALL"); setStatusFilter("WORKING"); }} className={systemTextButton}>Xóa bộ lọc</button>}
      </div>
      <div className="border-t border-slate-200 px-4"><SystemTabs label="Lọc nơi làm việc" active={locationFilter} onChange={setLocationFilter} items={[
        { key: "ALL", label: "Tất cả", count: ready ? statusEmployees.length : undefined },
        ...janitorLocations.map((location) => ({ key: location.value, label: location.label, count: ready ? statusEmployees.filter((employee) => (employee.workplace_location || "DORMITORY") === location.value).length : undefined })),
      ]} /></div>
    </section>
    {errorMessage ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm"><p className="text-red-800">{errorMessage}</p><button type="button" onClick={() => void loadJanitors()} className={`${systemSecondaryButton} mt-2`}>Thử lại</button></div>
      : <JanitorTable janitors={filteredJanitors} loading={loading} onEdit={openModal} onDelete={(employee) => { setDeleteError(null); setDeleteTarget(employee); }} />}
    <JanitorModal isOpen={isModalOpen} editingJanitor={editingJanitor} formData={formData} setFormData={setFormData} submitting={submitting} error={formError} onSubmit={handleSubmit} onClose={() => setIsModalOpen(false)} />
    <SystemDialog isOpen={deleteTarget !== null} onClose={() => { if (!deleting) setDeleteTarget(null); }} title="Xóa hồ sơ tạp vụ">
      {deleteTarget && <div className="space-y-4 text-sm">
        <p className="font-medium text-slate-900">{deleteTarget.name_latin} · {deleteTarget.employee_code || "Chưa có mã"}</p>
        <p className="text-red-800">Thao tác này xóa vĩnh viễn hồ sơ và dữ liệu liên quan, không thể khôi phục. Xác nhận xóa hồ sơ này?</p>
        {deleteError && <p role="alert" className="text-red-800">{deleteError}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className={systemSecondaryButton}>Hủy</button>
          <button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="min-h-11 cursor-pointer rounded-sm bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 sm:min-h-9">{deleting ? "Đang xóa…" : "Xóa hồ sơ"}</button></div>
      </div>}
    </SystemDialog>
  </div>;
}
