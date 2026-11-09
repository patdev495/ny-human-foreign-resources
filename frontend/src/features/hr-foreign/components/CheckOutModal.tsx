import { useState, type FormEvent } from "react";
import { checkoutStay } from "../api";
import type { ResidentInfo } from "../types";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetResident?: ResidentInfo | null;
  unitName?: string;
}

export function CheckOutModal({ isOpen, onClose, onSuccess, targetResident, unitName }: CheckOutModalProps) {
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!targetResident) return;
    if (!endDate) { setError("Vui lòng chọn ngày trả phòng."); return; }
    setSubmitting(true);
    setError(null);
    try { await checkoutStay(targetResident.stay_id, endDate); onSuccess(); onClose(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Không thể thực hiện trả phòng."); }
    finally { setSubmitting(false); }
  };
  return <SystemDialog isOpen={isOpen && Boolean(targetResident)} onClose={onClose} title="Trả phòng">
    {targetResident && <form onSubmit={handleSubmit} className="space-y-4">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-slate-200 pb-4 text-sm">
        <dt className="text-slate-600">Nhân sự</dt><dd className="break-words font-medium">{targetResident.name_latin}{targetResident.name_chinese && ` (${targetResident.name_chinese})`}</dd>
        <dt className="text-slate-600">Hộ chiếu</dt><dd className="break-words">{targetResident.passport_number || "—"}</dd>
        <dt className="text-slate-600">Chỗ ở</dt><dd className="break-words">{unitName || "—"}</dd>
        <dt className="text-slate-600">Ngày vào</dt><dd>{targetResident.start_date || "—"}</dd>
      </dl>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <div><label htmlFor="checkout-date" className="mb-1.5 block text-sm text-slate-700">Ngày trả phòng <span className="text-red-700">*</span></label>
        <input id="checkout-date" type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} className={systemField} /></div>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={onClose} className={systemSecondaryButton}>Hủy</button>
        <button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang xử lý…" : "Xác nhận trả phòng"}</button>
      </div>
    </form>}
  </SystemDialog>;
}
