import { Fragment, useId, useState } from "react";
import type { MonthlyVehicleContract, Vehicle } from "../../types";
import { contractDetails, contractDocumentKey } from "./contractDetails";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface MonthlyContractTableProps {
  contracts: MonthlyVehicleContract[];
  onEdit: (contract: MonthlyVehicleContract, ids: number[]) => void;
  onPdf: (title: string, key: string) => void;
}

export function MonthlyContractTable({ contracts, onEdit, onPdf }: MonthlyContractTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const id = useId();
  return <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
    <div role="region" aria-label="Bảng giá hợp đồng khoán tháng" tabIndex={0} className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50"><tr>{["Hợp đồng", "Phương tiện / biển số", "Thuê tháng (đ/xe)", "Hạn mức (km/tháng)", "Km phụ trội (đ/km)", "Thao tác"].map((title, index) => <th key={title} scope="col" className={`px-4 py-3 font-medium ${index >= 2 && index <= 4 ? "text-right" : ""}`}>{title}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">
          {contracts.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có hợp đồng khoán tháng.</td></tr>}
          {contracts.map(contract => {
            const docKey = contractDocumentKey(contract);
            return <Fragment key={contract.id}>
              <tr className="align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{contract.contract_name}</td>
                <td className="px-4 py-3"><div>{contract.vehicle_name || `Xe #${contract.vehicle_id}`}</div><div className="mt-1 text-slate-500">{contract.license_plate || "—"}</div></td>
                <td className="px-4 py-3 text-right tabular-nums">{contract.base_monthly_cost.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{contract.km_allowance.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{contract.excess_km_rate.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-2"><div className="flex flex-wrap gap-x-4">
                  <button type="button" aria-expanded={expanded === contract.id} aria-controls={`${id}-${contract.id}`} onClick={() => setExpanded(previous => previous === contract.id ? null : contract.id)} className={systemTextButton}>{expanded === contract.id ? "Thu gọn" : "Chi tiết"}</button>
                  <button type="button" onClick={() => onEdit(contract, [contract.id])} className={systemTextButton}>Sửa bảng giá</button>
                  {docKey && <button type="button" onClick={() => onPdf(contract.contract_name, docKey)} className={systemTextButton}>Xem PDF</button>}
                </div></td>
              </tr>
              {expanded === contract.id && <tr id={`${id}-${contract.id}`}><td colSpan={6} className="bg-slate-50 px-4 py-4">
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{contractDetails(contract).map(detail => <div key={detail.label}><dt className="text-slate-500">{detail.label}</dt><dd className="mt-1 tabular-nums text-slate-900">{detail.value}</dd></div>)}</dl>
                {contract.notes && <p className="mt-4 whitespace-pre-wrap text-slate-600">Ghi chú: {contract.notes}</p>}
              </td></tr>}
            </Fragment>;
          })}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{contracts.length} hợp đồng</p>
  </div>;
}

export function MonthlyVehicleTable({ vehicles, onEdit }: { vehicles: Vehicle[]; onEdit: (vehicle: Vehicle) => void }) {
  return <section className="space-y-3"><h2 className="text-base font-semibold text-slate-900">Phương tiện và tài xế</h2>
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
      <div role="region" aria-label="Phương tiện hợp đồng khoán tháng" tabIndex={0} className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50"><tr>{["Phương tiện", "Biển số", "Tài xế", "Điện thoại", "Trạng thái", "Thao tác"].map(title => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-200">
            {vehicles.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Chưa có phương tiện.</td></tr>}
            {vehicles.map(vehicle => <tr key={vehicle.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{vehicle.name}</td><td className="px-4 py-3">{vehicle.license_plate || "—"}</td><td className="px-4 py-3">{vehicle.driver_name || "—"}</td><td className="px-4 py-3">{vehicle.driver_phone || "—"}</td><td className="px-4 py-3">{vehicle.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}</td><td className="px-4 py-2"><button type="button" onClick={() => onEdit(vehicle)} className={systemTextButton} aria-label={`Sửa xe ${vehicle.name}`}>Sửa</button></td></tr>)}
          </tbody>
        </table>
      </div>
      <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{vehicles.length} phương tiện</p>
    </div>
  </section>;
}
