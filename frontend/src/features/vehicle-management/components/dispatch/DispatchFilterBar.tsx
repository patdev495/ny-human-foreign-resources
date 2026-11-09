import type { FormEvent } from "react";
import type { VehicleProvider } from "../../types";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../../shared/components/systemStyles";

interface DispatchFilterBarProps {
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  providers: VehicleProvider[];
  selectedProviderFilter: string;
  setSelectedProviderFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onOpenModal: () => void;
  disabled: boolean;
}

export function DispatchFilterBar(props: DispatchFilterBarProps) {
  return <form onSubmit={props.onSearchSubmit} className="flex flex-wrap items-end gap-3 rounded-sm border border-slate-200 bg-white p-4">
    <div className="w-full sm:w-56">
      <label htmlFor="dispatch-provider-filter" className="mb-1 block text-sm text-slate-700">Đơn vị / nhóm xe</label>
      <select id="dispatch-provider-filter" value={props.selectedProviderFilter} onChange={event => props.setSelectedProviderFilter(event.target.value)} className={systemField}>
        <option value="ALL">Tất cả đơn vị và nhóm xe</option>
        <option value="COMPANY_OWNED">Xe công ty</option>
        <option value="OUTSOURCED">Xe thuê ngoài</option>
        {props.providers.map(provider => <option key={provider.id} value={`PROVIDER_${provider.id}`}>{provider.name}</option>)}
      </select>
    </div>
    <div>
      <label htmlFor="dispatch-from" className="mb-1 block text-sm text-slate-700">Từ ngày</label>
      <input id="dispatch-from" type="date" value={props.fromDate} max={props.toDate || undefined} onChange={event => props.setFromDate(event.target.value)} className={systemField} />
    </div>
    <div>
      <label htmlFor="dispatch-to" className="mb-1 block text-sm text-slate-700">Đến ngày</label>
      <input id="dispatch-to" type="date" value={props.toDate} min={props.fromDate || undefined} onChange={event => props.setToDate(event.target.value)} className={systemField} />
    </div>
    <div className="min-w-48 flex-1">
      <label htmlFor="dispatch-search" className="mb-1 block text-sm text-slate-700">Tìm kiếm</label>
      <input id="dispatch-search" type="search" value={props.searchQuery} onChange={event => props.setSearchQuery(event.target.value)} placeholder="Nhà xe, tài xế, hành khách, lộ trình…" className={systemField} />
    </div>
    <button type="submit" className={systemSecondaryButton}>Tìm kiếm</button>
    <button type="button" disabled={props.disabled} onClick={props.onOpenModal} className={systemPrimaryButton}>Thêm chuyến</button>
  </form>;
}
