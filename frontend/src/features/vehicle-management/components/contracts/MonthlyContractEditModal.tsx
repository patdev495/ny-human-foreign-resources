import type { Dispatch, FormEvent, SetStateAction } from "react";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";
import type { MonthlyVehicleContract } from "../../types";
import type { ContractEditPackage } from "./contractDetails";

type NumberKey = "base_monthly_cost" | "km_allowance" | "excess_km_rate" | "overtime_rate_weekday" | "sunday_daily_rate" | "overtime_rate_weekend";
const numberFields: { key: NumberKey; label: string; required?: boolean }[] = [
  { key: "base_monthly_cost", label: "Giá thuê tháng (đ/xe)", required: true },
  { key: "km_allowance", label: "Hạn mức (km/tháng)", required: true },
  { key: "excess_km_rate", label: "Km phụ trội (đ/km)", required: true },
  { key: "overtime_rate_weekday", label: "Tăng ca ngày thường (đ/giờ)", required: true },
  { key: "sunday_daily_rate", label: "Mức ngày Chủ nhật (đ/ngày)" },
  { key: "overtime_rate_weekend", label: "Tăng ca Chủ nhật (đ/giờ)" },
];
const timeFields = [
  { key: "standard_start_time", label: "Giờ bắt đầu T2–T7" }, { key: "standard_end_time", label: "Giờ kết thúc T2–T7" },
  { key: "sunday_standard_start_time", label: "Giờ bắt đầu Chủ nhật" }, { key: "sunday_standard_end_time", label: "Giờ kết thúc Chủ nhật" },
] as const;

interface Props {
  editingContractPackage: ContractEditPackage | null;
  setEditingContractPackage: Dispatch<SetStateAction<ContractEditPackage | null>>;
  onSave: (event: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}

export function MonthlyContractEditModal({ editingContractPackage: pack, setEditingContractPackage, onSave, submitting, error }: Props) {
  function update(changes: Partial<MonthlyVehicleContract>) {
    setEditingContractPackage(previous => previous ? { ...previous, contract: { ...previous.contract, ...changes } } : null);
  }
  const close = () => { if (!submitting) setEditingContractPackage(null); };
  return <SystemDialog isOpen={pack !== null} onClose={close} title="Sửa bảng giá hợp đồng" wide>
    {pack && <form onSubmit={onSave} className="space-y-4">
      <p className="text-sm text-slate-600">{pack.linkedContractIds.length > 1 ? `Áp dụng chung cho ${pack.linkedContractIds.length} hợp đồng xe 7 chỗ. Các trường trong form sẽ được cập nhật theo giá trị đang hiển thị.` : `Áp dụng cho ${pack.contract.vehicle_name || pack.contract.contract_name}.`}</p>
      <fieldset disabled={submitting} className="space-y-4">
        <label className="block text-sm text-slate-700"><span className="mb-1 block">Tên hợp đồng *</span><input required value={pack.contract.contract_name} onChange={event => update({ contract_name: event.target.value })} className={systemField} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {numberFields.map(field => <label key={field.key} className="block text-sm text-slate-700"><span className="mb-1 block">{field.label}{field.required && " *"}</span><input type="number" required={field.required} value={pack.contract[field.key]} onChange={event => update({ [field.key]: Number(event.target.value) })} className={systemField} /></label>)}
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
          {timeFields.map(field => <label key={field.key} className="block text-sm text-slate-700"><span className="mb-1 block">{field.label} *</span><input type="time" step="1" required value={pack.contract[field.key] || ""} onChange={event => update({ [field.key]: event.target.value })} className={systemField} /></label>)}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={close} disabled={submitting} className={systemSecondaryButton}>Hủy</button><button type="submit" disabled={submitting} className={systemPrimaryButton}>{submitting ? "Đang lưu…" : "Lưu bảng giá"}</button></div>
    </form>}
  </SystemDialog>;
}
