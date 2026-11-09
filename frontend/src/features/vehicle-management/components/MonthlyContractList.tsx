import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { fetchMonthlyContracts, updateMonthlyContract, fetchVehicles, updateVehicle } from "../api";
import type { MonthlyVehicleContract, Vehicle } from "../types";
import { PdfViewerModal } from "./PdfViewerModal";
import { MonthlyContractEditModal } from "./contracts/MonthlyContractEditModal";
import { MonthlyVehicleEditModal } from "./contracts/MonthlyVehicleEditModal";
import { MonthlyContractCards } from "./contracts/MonthlyContractCards";
import { applyContractEdits, type ContractEditPackage } from "./contracts/contractDetails";
import { systemSecondaryButton } from "../../../shared/components/systemStyles";

export function MonthlyContractList() {
  const [contracts, setContracts] = useState<MonthlyVehicleContract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<ContractEditPackage | null>(null);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<{ title: string; key: string } | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const [contractData, vehicleData] = await Promise.all([fetchMonthlyContracts(), fetchVehicles("COMPANY_OWNED")]);
      if (current === request.current) { setContracts(contractData); setVehicles(vehicleData); }
    } catch (failure: unknown) {
      if (current === request.current) setError(failure instanceof Error ? failure.message : "Không tải được hợp đồng và phương tiện.");
    } finally { if (current === request.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { request.current += 1; }; }, [load]);

  function editContract(contract: MonthlyVehicleContract, ids: number[]) {
    setContractError(null);
    setEditingPackage({ contract: { ...contract }, linkedContractIds: ids });
  }

  async function saveContract(event: FormEvent) {
    event.preventDefault();
    if (!editingPackage || submittingContract) return;
    setSubmittingContract(true);
    setContractError(null);
    try {
      const { contract, linkedContractIds } = editingPackage;
      const result = await Promise.allSettled(linkedContractIds.map(id => {
        const target = contracts.find(item => item.id === id);
        return updateMonthlyContract(id, applyContractEdits(target || contract, contract));
      }));
      const failed = result.filter(item => item.status === "rejected");
      if (failed.length > 0) {
        const failure: unknown = failed[0].reason;
        const succeeded = result.length - failed.length;
        setContractError(`${succeeded > 0 ? `Đã lưu ${succeeded}/${result.length} hợp đồng. ` : ""}${failure instanceof Error ? failure.message : "Không lưu được bảng giá."} Có thể thử lưu lại.`);
        if (succeeded > 0) void load();
      } else { setEditingPackage(null); void load(); }
    } finally { setSubmittingContract(false); }
  }

  async function saveVehicle(event: FormEvent) {
    event.preventDefault();
    if (!editingVehicle || submittingVehicle) return;
    setSubmittingVehicle(true);
    setVehicleError(null);
    try {
      await updateVehicle(editingVehicle.id, { provider_id: editingVehicle.provider_id, ownership_group: editingVehicle.ownership_group,
        name: editingVehicle.name, driver_name: editingVehicle.driver_name, license_plate: editingVehicle.license_plate,
        driver_phone: editingVehicle.driver_phone, default_cost: editingVehicle.default_cost, is_active: editingVehicle.is_active });
      setEditingVehicle(null);
      void load();
    } catch (failure: unknown) { setVehicleError(failure instanceof Error ? failure.message : "Không lưu được thông tin xe."); }
    finally { setSubmittingVehicle(false); }
  }

  return <div className="space-y-4">
    {loading && <p role="status" className="py-6 text-sm text-slate-500">Đang tải hợp đồng khoán tháng…</p>}
    {!loading && error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void load()} className={systemSecondaryButton}>Thử lại</button></div>}
    {!loading && !error && <>
      <p className="text-sm text-slate-600">{contracts.length} hợp đồng · {vehicles.length} phương tiện. Đơn giá và phụ phí theo hợp đồng đang áp dụng.</p>
      <MonthlyContractCards contracts={contracts} vehicles={vehicles} onEdit={editContract}
        onPdf={(title, key) => setPdf({ title, key })}
        onEditVehicle={vehicle => { setVehicleError(null); setEditingVehicle({ ...vehicle }); }} />
    </>}
    <MonthlyContractEditModal editingContractPackage={editingPackage} setEditingContractPackage={setEditingPackage} onSave={saveContract} submitting={submittingContract} error={contractError} />
    <MonthlyVehicleEditModal editingVehicle={editingVehicle} setEditingVehicle={setEditingVehicle} onSave={saveVehicle} submitting={submittingVehicle} error={vehicleError} />
    <PdfViewerModal isOpen={pdf !== null} title={pdf?.title || "Hợp đồng"} docKey={pdf?.key || null} onClose={() => setPdf(null)} />
  </div>;
}
