import type { Dispatch, SetStateAction, FormEvent } from "react";
import type { ForeignEmployee } from "../../types";
import { type JanitorFormData, janitorLocations } from "./janitorUtils";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";

interface JanitorModalProps {
  isOpen: boolean;
  editingJanitor: ForeignEmployee | null;
  formData: JanitorFormData;
  setFormData: Dispatch<SetStateAction<JanitorFormData>>;
  submitting: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function JanitorModal({ isOpen, editingJanitor, formData, setFormData, submitting, error, onSubmit, onClose }: JanitorModalProps) {
  return <SystemDialog isOpen={isOpen} onClose={onClose} title={editingJanitor ? "Sửa hồ sơ tạp vụ" : "Thêm nhân sự tạp vụ"} wide>
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <fieldset disabled={submitting} className="min-w-0 space-y-4 disabled:opacity-60">
        <div><label htmlFor="janitor-name" className="mb-1.5 block text-sm text-slate-700">Họ và tên <span className="text-red-700">*</span></label>
          <input id="janitor-name" required value={formData.name_latin} onChange={(event) => setFormData({ ...formData, name_latin: event.target.value })} className={systemField} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="janitor-code" className="mb-1.5 block text-sm text-slate-700">Mã nhân sự</label>
            <input id="janitor-code" value={formData.employee_code} onChange={(event) => setFormData({ ...formData, employee_code: event.target.value })} className={systemField} /></div>
          <div><label htmlFor="janitor-location" className="mb-1.5 block text-sm text-slate-700">Nơi làm việc <span className="text-red-700">*</span></label>
            <select id="janitor-location" value={formData.workplace_location} onChange={(event) => setFormData({ ...formData, workplace_location: event.target.value })} className={systemField}>
              {janitorLocations.map((location) => <option key={location.value} value={location.value}>{location.label}</option>)}
            </select></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="janitor-salary" className="mb-1.5 block text-sm text-slate-700">Mức lương (đ)</label>
            <input id="janitor-salary" type="number" min={0} step={50000} value={formData.salary} onChange={(event) => setFormData({ ...formData, salary: Number(event.target.value) })} className={systemField} /></div>
          <div><label htmlFor="janitor-salary-unit" className="mb-1.5 block text-sm text-slate-700">Đơn vị tính lương</label>
            <select id="janitor-salary-unit" value={formData.salary_unit} onChange={(event) => setFormData({ ...formData, salary_unit: event.target.value })} className={systemField}>
              <option value="MONTH">Theo tháng</option><option value="DAY">Theo ngày công</option>
            </select></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="janitor-status" className="mb-1.5 block text-sm text-slate-700">Trạng thái làm việc</label>
            <select id="janitor-status" value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className={systemField}>
              <option value="WORKING">Đang làm việc</option><option value="RESIGNED">Đã nghỉ việc</option>
            </select></div>
          {formData.status === "RESIGNED" && <div><label htmlFor="janitor-resigned-date" className="mb-1.5 block text-sm text-slate-700">Ngày nghỉ việc</label>
            <input id="janitor-resigned-date" type="date" value={formData.resignation_date} onChange={(event) => setFormData({ ...formData, resignation_date: event.target.value })} className={systemField} /></div>}
        </div>
        <div><label htmlFor="janitor-role" className="mb-1.5 block text-sm text-slate-700">Chức danh / Công việc</label>
          <input id="janitor-role" value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })} className={systemField} /></div>
        <div><label htmlFor="janitor-notes" className="mb-1.5 block text-sm text-slate-700">Ghi chú</label>
          <textarea id="janitor-notes" rows={3} value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className={systemField} /></div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className={systemSecondaryButton}>Hủy</button>
          <button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Lưu hồ sơ"}</button></div>
      </fieldset>
    </form>
  </SystemDialog>;
}
