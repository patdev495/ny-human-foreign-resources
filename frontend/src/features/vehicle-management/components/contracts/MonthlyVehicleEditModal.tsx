import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Vehicle } from "../../types";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";

interface Props {
  editingVehicle: Vehicle | null;
  setEditingVehicle: Dispatch<SetStateAction<Vehicle | null>>;
  onSave: (event: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}
const fields = [
  { key: "name", label: "Tên xe / dòng xe", required: true, type: "text" },
  { key: "license_plate", label: "Biển số", type: "text" },
  { key: "driver_name", label: "Họ tên tài xế", type: "text" },
  { key: "driver_phone", label: "Điện thoại tài xế", type: "tel" },
] as const;

export function MonthlyVehicleEditModal({ editingVehicle, setEditingVehicle, onSave, submitting, error }: Props) {
  const close = () => { if (!submitting) setEditingVehicle(null); };
  return <SystemDialog isOpen={editingVehicle !== null} onClose={close} title="Sửa phương tiện và tài xế">
    {editingVehicle && <form onSubmit={onSave} className="space-y-4">
      <fieldset disabled={submitting} className="space-y-3">{fields.map(field => <label key={field.key} className="block text-sm text-slate-700"><span className="mb-1 block">{field.label}{"required" in field && " *"}</span><input type={field.type} required={"required" in field} value={editingVehicle[field.key] || ""} onChange={event => setEditingVehicle({ ...editingVehicle, [field.key]: event.target.value })} className={systemField} /></label>)}</fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={close} disabled={submitting} className={systemSecondaryButton}>Hủy</button><button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Lưu thông tin xe"}</button></div>
    </form>}
  </SystemDialog>;
}
