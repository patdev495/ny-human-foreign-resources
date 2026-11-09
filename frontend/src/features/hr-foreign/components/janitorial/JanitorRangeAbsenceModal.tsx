import { useEffect, useState, type FormEvent } from "react";
import type { ForeignEmployee } from "../../types";
import { saveJanitorRangeAbsence } from "../../api/janitorApi";
import { janitorLocationLabel } from "./janitorUtils";
import { vietnamDate } from "../meal-forecast/vietnamDate";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";

interface JanitorRangeAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: ForeignEmployee[];
  onSuccess: () => void;
}

export function JanitorRangeAbsenceModal({ isOpen, onClose, employees, onSuccess }: JanitorRangeAbsenceModalProps) {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(vietnamDate);
  const [endDate, setEndDate] = useState(vietnamDate);
  const [absenceType, setAbsenceType] = useState<"FULL_DAY" | "HALF_DAY">("FULL_DAY");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId(employees[0]?.id ?? "");
    setStartDate(vietnamDate());
    setEndDate(vietnamDate());
    setAbsenceType("FULL_DAY");
    setReason("");
    setError(null);
  }, [isOpen, employees]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitting) return;
    if (!employeeId) { setError("Vui lòng chọn nhân sự tạp vụ."); return; }
    if (!startDate || !endDate) { setError("Vui lòng nhập đủ từ ngày và đến ngày."); return; }
    if (startDate > endDate) { setError("Từ ngày không được sau đến ngày."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await saveJanitorRangeAbsence({ employee_id: Number(employeeId), start_date: startDate, end_date: endDate, absence_type: absenceType, reason: reason.trim() || undefined });
      onSuccess();
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Không thể đăng ký nghỉ theo đợt."); }
    finally { setSubmitting(false); }
  };

  return <SystemDialog isOpen={isOpen} onClose={onClose} title="Đăng ký nghỉ theo đợt">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <fieldset disabled={submitting} className="min-w-0 space-y-4 disabled:opacity-60">
        <div><label htmlFor="janitor-range-employee" className="mb-1.5 block text-sm text-slate-700">Nhân sự tạp vụ <span className="text-red-700">*</span></label>
          <select id="janitor-range-employee" required value={employeeId} onChange={(event) => setEmployeeId(event.target.value ? Number(event.target.value) : "")} className={systemField}>
            <option value="">Chọn nhân sự</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name_latin} · {employee.employee_code || "Chưa có mã"} · {janitorLocationLabel(employee.workplace_location)}</option>)}
          </select></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="janitor-range-start" className="mb-1.5 block text-sm text-slate-700">Từ ngày <span className="text-red-700">*</span></label>
            <input id="janitor-range-start" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className={systemField} /></div>
          <div><label htmlFor="janitor-range-end" className="mb-1.5 block text-sm text-slate-700">Đến ngày <span className="text-red-700">*</span></label>
            <input id="janitor-range-end" type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} className={systemField} /></div>
        </div>
        <fieldset><legend className="mb-1.5 text-sm text-slate-700">Hình thức nghỉ</legend><div className="flex flex-wrap gap-x-4 gap-y-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="janitor-range-type" checked={absenceType === "FULL_DAY"} onChange={() => setAbsenceType("FULL_DAY")} className="h-4 w-4 accent-slate-800" /> Nghỉ cả ngày</label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="janitor-range-type" checked={absenceType === "HALF_DAY"} onChange={() => setAbsenceType("HALF_DAY")} className="h-4 w-4 accent-slate-800" /> Nghỉ nửa ngày</label>
        </div></fieldset>
        <div><label htmlFor="janitor-range-reason" className="mb-1.5 block text-sm text-slate-700">Lý do nghỉ</label>
          <input id="janitor-range-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nghỉ phép, nghỉ ốm, việc riêng…" className={systemField} /></div>
        <p className="text-xs text-slate-600">Chủ nhật được bỏ qua khi đăng ký nghỉ theo khoảng ngày.</p>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className={systemSecondaryButton}>Hủy</button>
          <button type="submit" disabled={submitting || employees.length === 0} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Đăng ký nghỉ"}</button></div>
      </fieldset>
    </form>
  </SystemDialog>;
}
