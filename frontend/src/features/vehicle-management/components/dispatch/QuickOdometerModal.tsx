import { useEffect, useState, type FormEvent } from "react";
import { updateDispatch } from "../../api";
import type { VehicleDispatch } from "../../types";
import { SystemDialog } from "../../../../shared/components/SystemDialog";
import { systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";
import { DispatchField } from "./DispatchField";
import { dispatchPayload } from "./dispatchForm";

interface QuickOdometerModalProps {
  isOpen: boolean;
  dispatch: VehicleDispatch | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickOdometerModal({ isOpen, dispatch, onClose, onSuccess }: QuickOdometerModalProps) {
  const [odometerKm, setOdometerKm] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [tollFee, setTollFee] = useState("");
  const [mealCount, setMealCount] = useState("");
  const [overnightCount, setOvernightCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !dispatch) return;
    const odometer = dispatch.odometer_km ?? dispatch.start_km ?? dispatch.end_km;
    setOdometerKm(odometer != null ? String(odometer) : "");
    setReturnTime(dispatch.return_time || "");
    setTollFee(String(dispatch.toll_fee || 0));
    setMealCount(String(dispatch.meal_count || 0));
    setOvernightCount(String(dispatch.overnight_count || 0));
    setError(null);
  }, [isOpen, dispatch]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!dispatch || saving) return;
    setSaving(true);
    setError(null);
    try {
      const odometer = odometerKm !== "" ? Number(odometerKm) : undefined;
      await updateDispatch(dispatch.id, { ...dispatchPayload(dispatch), return_time: returnTime || undefined,
        odometer_km: odometer, start_km: odometer, end_km: odometer,
        toll_fee: Number(tollFee) || 0, meal_count: Number(mealCount) || 0, overnight_count: Number(overnightCount) || 0 });
      onSuccess();
      onClose();
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : "Không lưu được thông tin chuyến xe.");
    } finally { setSaving(false); }
  }

  return <SystemDialog isOpen={isOpen && dispatch !== null} onClose={() => { if (!saving) onClose(); }} title="Chốt đồng hồ và giờ về">
    {dispatch && <form onSubmit={save} className="space-y-4">
      <div className="space-y-1 border-b border-slate-200 pb-3 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{dispatch.vehicle_name}</p>
        <p>{dispatch.dispatch_date.split("-").reverse().join("/")} · Giờ đón: {dispatch.pickup_time || "—"}</p>
        <p>{dispatch.pickup_location || "—"} → {dispatch.dropoff_location || "—"}</p>
      </div>
      <fieldset disabled={saving} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DispatchField label="Số km trên đồng hồ" type="number" min="0" step="0.1" value={odometerKm} onChange={event => setOdometerKm(event.target.value)} />
          <DispatchField label="Giờ về / kết thúc" type="time" value={returnTime} onChange={event => setReturnTime(event.target.value)} />
        </div>
        <DispatchField label="Vé xe / cầu đường (đ)" type="number" min="0" step="5000" value={tollFee} onChange={event => setTollFee(event.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DispatchField label="Số bữa ăn ngoài" type="number" min="0" step="1" value={mealCount} onChange={event => setMealCount(event.target.value)} />
          <DispatchField label="Số đêm qua đêm" type="number" min="0" step="1" value={overnightCount} onChange={event => setOvernightCount(event.target.value)} />
        </div>
      </fieldset>
      <p className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Chuyến đầu ngày cần giờ đón và đồng hồ đầu. Chuyến cuối ngày cần giờ về và đồng hồ cuối. Phụ phí và tăng ca được tính theo hợp đồng của xe.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <button type="button" disabled={saving} onClick={onClose} className={systemSecondaryButton}>Hủy</button>
        <button type="submit" disabled={saving} className={systemPrimaryButton}>{saving ? "Đang lưu…" : "Lưu cập nhật"}</button>
      </div>
    </form>}
  </SystemDialog>;
}
