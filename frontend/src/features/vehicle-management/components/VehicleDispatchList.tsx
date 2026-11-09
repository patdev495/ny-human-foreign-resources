import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createDispatch, deleteDispatch, fetchDispatches, fetchProviders, fetchVehicles, updateDispatch } from "../api";
import type { OwnershipGroup, Vehicle, VehicleDispatch, VehicleDispatchCreatePayload, VehicleProvider } from "../types";
import { DispatchFilterBar } from "./dispatch/DispatchFilterBar";
import { DispatchModal } from "./dispatch/DispatchModal";
import { DispatchTable } from "./dispatch/DispatchTable";
import { QuickOdometerModal } from "./dispatch/QuickOdometerModal";
import { dispatchPayload, emptyDispatch } from "./dispatch/dispatchForm";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";

export function VehicleDispatchList() {
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [providers, setProviders] = useState<VehicleProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const request = useRef(0);
  const [quickDispatch, setQuickDispatch] = useState<VehicleDispatch | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<VehicleDispatch | null>(null);
  const [formData, setFormData] = useState<VehicleDispatchCreatePayload>(emptyDispatch);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<VehicleDispatch | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadData = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    if (fromDate && toDate && fromDate > toDate) {
      setError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      setLoading(false);
      return;
    }
    try {
      const ownershipGroup: OwnershipGroup | undefined = providerFilter === "COMPANY_OWNED" || providerFilter === "OUTSOURCED" ? providerFilter : undefined;
      const [dispatchData, vehicleData, providerData] = await Promise.all([
        fetchDispatches({ fromDate: fromDate || undefined, toDate: toDate || undefined, ownershipGroup,
          providerId: providerFilter.startsWith("PROVIDER_") ? Number(providerFilter.slice(9)) : undefined,
          search: appliedSearch || undefined }),
        fetchVehicles(), fetchProviders(),
      ]);
      if (current !== request.current) return;
      setDispatches(dispatchData);
      setVehicles(vehicleData);
      setProviders(providerData);
    } catch (failure: unknown) {
      if (current === request.current) setError(failure instanceof Error ? failure.message : "Không tải được nhật ký điều xe.");
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [fromDate, toDate, providerFilter, appliedSearch]);

  useEffect(() => {
    void loadData();
    return () => { request.current += 1; };
  }, [loadData]);

  function openModal(dispatch?: VehicleDispatch) {
    setSaveError(null);
    setEditingDispatch(dispatch || null);
    if (dispatch) setFormData(dispatchPayload(dispatch));
    else {
      const provider = providers.find(item => item.name === "Bình An") || providers[0];
      const vehicle = provider?.provider_type === "COMPANY_OWNED"
        ? vehicles.find(item => item.provider_id === provider.id || item.ownership_group === "COMPANY_OWNED") : undefined;
      setFormData({ ...emptyDispatch(), provider_id: provider?.id, provider_name: provider?.name,
        ownership_group: provider?.provider_type || "OUTSOURCED", vehicle_id: vehicle?.id,
        vehicle_name: vehicle?.name || "", driver_name: vehicle?.driver_name || "",
        license_plate: vehicle?.license_plate || "", driver_phone: vehicle?.driver_phone || "" });
    }
    setModalOpen(true);
  }

  function selectVehicle(id: string) {
    const vehicle = vehicles.find(item => item.id === Number(id));
    if (!vehicle) return;
    setFormData(previous => ({ ...previous, vehicle_id: vehicle.id, vehicle_name: vehicle.name,
      ownership_group: vehicle.ownership_group, provider_id: vehicle.provider_id || previous.provider_id,
      driver_name: vehicle.driver_name || previous.driver_name, license_plate: vehicle.license_plate || previous.license_plate,
      driver_phone: vehicle.driver_phone || previous.driver_phone, cost: vehicle.default_cost || previous.cost }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editingDispatch) await updateDispatch(editingDispatch.id, formData);
      else await createDispatch(formData);
      setModalOpen(false);
      void loadData();
    } catch (failure: unknown) {
      setSaveError(failure instanceof Error ? failure.message : "Không lưu được chuyến điều xe.");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteDispatch(deleting.id);
      setDeleting(null);
      void loadData();
    } catch (failure: unknown) {
      setDeleteError(failure instanceof Error ? failure.message : "Không xóa được chuyến điều xe.");
    } finally { setDeleteBusy(false); }
  }

  const outsourced = dispatches.filter(item => item.ownership_group === "OUTSOURCED").length;
  const total = dispatches.reduce((sum, item) => sum + (item.cost || 0), 0);
  return <div className="space-y-4">
    <DispatchFilterBar fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
      providers={providers} selectedProviderFilter={providerFilter} setSelectedProviderFilter={setProviderFilter}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery} disabled={loading || !!error}
      onSearchSubmit={event => { event.preventDefault(); if (appliedSearch === searchQuery.trim()) void loadData(); else setAppliedSearch(searchQuery.trim()); }}
      onOpenModal={() => openModal()} />
    {loading && <p role="status" className="py-6 text-sm text-slate-500">Đang tải nhật ký điều xe…</p>}
    {!loading && error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700">
      <span>{error}</span><button type="button" onClick={() => void loadData()} className={systemSecondaryButton}>Thử lại</button>
    </div>}
    {!loading && !error && <>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
        <span>Tổng: <strong className="font-semibold text-slate-900">{dispatches.length} chuyến</strong></span>
        <span>Xe công ty: {dispatches.length - outsourced}</span><span>Xe thuê ngoài: {outsourced}</span>
        <span>Cước theo bộ lọc: <strong className="font-semibold text-slate-900">{total.toLocaleString("vi-VN")} đ</strong></span>
      </p>
      <DispatchTable dispatches={dispatches} onEdit={openModal} onDelete={dispatch => { setDeleteError(null); setDeleting(dispatch); }} onQuickOdo={setQuickDispatch} />
    </>}
    <DispatchModal isOpen={modalOpen} editingDispatch={editingDispatch} formData={formData} setFormData={setFormData}
      vehicles={vehicles} providers={providers} onVehicleSelect={selectVehicle} onSave={save}
      onClose={() => { if (!saving) setModalOpen(false); }} saving={saving} error={saveError} />
    <QuickOdometerModal isOpen={quickDispatch !== null} dispatch={quickDispatch} onClose={() => setQuickDispatch(null)} onSuccess={() => void loadData()} />
    <SystemDialog isOpen={deleting !== null} onClose={() => { if (!deleteBusy) setDeleting(null); }} title="Xóa chuyến điều xe">
      <p className="text-sm text-slate-700">Xóa chuyến {deleting?.vehicle_name} ngày {deleting?.dispatch_date.split("-").reverse().join("/")}?</p>
      {deleteError && <p role="alert" className="mt-3 text-sm text-red-700">{deleteError}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={deleteBusy} onClick={() => setDeleting(null)} className={systemSecondaryButton}>Hủy</button>
        <button type="button" disabled={deleteBusy} onClick={() => void remove()} className={`${systemPrimaryButton} bg-red-700 hover:bg-red-800`}>{deleteBusy ? "Đang xóa…" : "Xóa chuyến"}</button>
      </div>
    </SystemDialog>
  </div>;
}
