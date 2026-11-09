import { Car, Truck, FileText, Settings2, Phone, Pencil, ShieldCheck, Clock } from "lucide-react";
import type { MonthlyVehicleContract, Vehicle } from "../../types";
import { contractDetails, contractDocumentKey } from "./contractDetails";

interface Props {
  contracts: MonthlyVehicleContract[];
  vehicles: Vehicle[];
  onEdit: (contract: MonthlyVehicleContract, ids: number[]) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onPdf: (title: string, key: string) => void;
}

const themes = {
  indigo: {
    icon: "border-indigo-400/30 bg-indigo-500/20 text-indigo-300",
    button: "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-400",
    price: "text-indigo-700",
    highlight: "border-indigo-100 bg-indigo-50 text-indigo-950",
  },
  emerald: {
    icon: "border-emerald-400/30 bg-emerald-500/20 text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-400",
    price: "text-emerald-700",
    highlight: "border-emerald-100 bg-emerald-50 text-emerald-950",
  },
};
type Theme = typeof themes.indigo;
const action = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const money = (value: number): string => value.toLocaleString("vi-VN");

function termsKey(contract: MonthlyVehicleContract): string {
  return JSON.stringify([contract.base_monthly_cost, contract.km_allowance, contract.excess_km_rate,
    contractDetails(contract), contract.notes || ""]);
}

function ContractRates({ contract, theme }: { contract: MonthlyVehicleContract; theme: Theme }) {
  const details = contractDetails(contract);
  return <div className="space-y-4 p-4 sm:p-5">
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
        <span className="text-sm font-medium text-slate-600">Giá thuê khoán trọn gói</span>
        <p className={`text-xl font-bold tabular-nums ${theme.price}`}>{money(contract.base_monthly_cost)} <span className="text-xs font-medium">đ/tháng/xe</span></p>
      </div>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-xs text-slate-500">Hạn mức km chuẩn</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{money(contract.km_allowance)} km/tháng</dd></div>
        <div><dt className="text-xs text-slate-500">Đơn giá km phụ trội</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-rose-700">{money(contract.excess_km_rate)} đ/km</dd></div>
      </dl>
    </div>
    <section className="rounded-xl border border-slate-200 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock className={`h-4 w-4 ${theme.price}`} aria-hidden="true" />Khung giờ làm việc</h4>
      <dl className="grid gap-3 sm:grid-cols-2">{details.slice(0, 2).map(detail => <div key={detail.label}>
        <dt className="text-xs text-slate-500">{detail.label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{detail.value}</dd>
      </div>)}</dl>
    </section>
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ShieldCheck className={`h-4 w-4 ${theme.price}`} aria-hidden="true" />Tăng ca và phụ phí hợp đồng</h4>
      <dl className="grid gap-3 sm:grid-cols-2">{details.slice(2).map((detail, index) => <div key={detail.label}
        className={`rounded-lg border p-3 ${index < 2 ? theme.highlight : index >= 4 && index < 6 ? "border-amber-100 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50/70 text-slate-800"}`}>
        <dt className="text-xs">{detail.label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{detail.value}</dd>
      </div>)}</dl>
    </section>
    {contract.notes && <p className="whitespace-pre-wrap rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950">{contract.notes}</p>}
  </div>;
}

function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: (vehicle: Vehicle) => void }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
    <div className="min-w-0 space-y-1">
      <p className="text-sm font-bold tabular-nums text-slate-900">{vehicle.license_plate || "Chưa có biển số"}</p>
      <p className="break-words text-xs text-slate-600">{vehicle.name}</p>
      <p className="text-xs text-slate-700">Tài xế: <strong className="font-semibold">{vehicle.driver_name || "Chưa cập nhật"}</strong></p>
      {vehicle.driver_phone && <p className="flex items-center gap-1 text-xs tabular-nums text-slate-600"><Phone className="h-3 w-3" aria-hidden="true" />{vehicle.driver_phone}</p>}
      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${vehicle.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{vehicle.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}</span>
    </div>
    <button type="button" onClick={() => onEdit(vehicle)} aria-label={`Sửa xe ${vehicle.name}`} className={`${action} bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-indigo-600`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Sửa xe</button>
  </div>;
}

function ContractPackage({ contracts, vehicles, onEdit, onEditVehicle, onPdf }: Props) {
  const first = contracts[0];
  const docKey = contractDocumentKey(first);
  const truck = docKey === "HD_xetai_DucAnh";
  const theme = truck ? themes.emerald : themes.indigo;
  const Icon = truck ? Truck : Car;
  const title = truck ? "Gói thuê khoán xe tải" : docKey === "HD_7seat_DucAnh" ? "Gói thuê khoán xe 7 chỗ" : first.contract_name;
  const sharedTerms = contracts.every(contract => termsKey(contract) === termsKey(first));
  const groupVehicles = vehicles.filter(vehicle => contracts.some(contract => contract.vehicle_id === vehicle.id));
  return <article className="min-w-0 self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="space-y-4 border-b border-slate-800 bg-slate-900 p-4 text-white sm:p-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.icon}`}><Icon className="h-6 w-6" aria-hidden="true" /></div>
        <div className="min-w-0"><h3 className="text-base font-bold">{title}</h3><p className="mt-1 text-xs text-slate-300">{contracts.length} hợp đồng · {groupVehicles.length} phương tiện</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {docKey && <button type="button" onClick={() => onPdf(title, docKey)} className={`${action} border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-white`}><FileText className="h-3.5 w-3.5" aria-hidden="true" />Xem PDF hợp đồng</button>}
        {contracts.length === 1 && <button type="button" onClick={() => onEdit(first, [first.id])} className={`${action} text-white ${theme.button}`}><Settings2 className="h-3.5 w-3.5" aria-hidden="true" />Cấu hình bảng giá</button>}
        {docKey === "HD_7seat_DucAnh" && contracts.length > 1 && <button type="button" onClick={() => onEdit(first, contracts.map(contract => contract.id))} className={`${action} text-white ${theme.button}`}><Settings2 className="h-3.5 w-3.5" aria-hidden="true" />Sửa chung xe 7 chỗ ({contracts.length} hợp đồng)</button>}
      </div>
    </header>
    {sharedTerms ? <>
      <ContractRates contract={first} theme={theme} />
      {contracts.length > 1 && <p className="px-5 pb-4 text-xs text-slate-500">Các hợp đồng trong gói đang có cùng đơn giá và điều khoản.</p>}
    </> : <div className="divide-y divide-slate-200">{contracts.map(contract => <section key={contract.id}>
      <h4 className={`px-5 pt-5 text-sm font-semibold ${theme.price}`}>{contract.contract_name} · {contract.license_plate || contract.vehicle_name || `Xe #${contract.vehicle_id}`}</h4>
      <ContractRates contract={contract} theme={theme} />
    </section>)}</div>}
    <footer className="space-y-3 border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700"><Icon className={`h-4 w-4 ${theme.price}`} aria-hidden="true" />Hợp đồng và phương tiện áp dụng</h4>
      <ul className="space-y-2">{contracts.map(contract => <li key={contract.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="min-w-0 break-words text-slate-600">{contract.contract_name}<span className="ml-1 font-semibold text-slate-800">· {contract.license_plate || contract.vehicle_name || `Xe #${contract.vehicle_id}`}</span></span>
        <button type="button" onClick={() => onEdit(contract, [contract.id])} aria-label={`Sửa bảng giá ${contract.contract_name} ${contract.license_plate || contract.vehicle_name || contract.vehicle_id}`} className={`${action} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:outline-indigo-600`}>Sửa riêng bảng giá</button>
      </li>)}</ul>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{groupVehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={onEditVehicle} />)}</div>
    </footer>
  </article>;
}

export function MonthlyContractCards(props: Props) {
  const groups = new Map<string, MonthlyVehicleContract[]>();
  for (const contract of props.contracts) {
    const key = contractDocumentKey(contract) || `contract-${contract.id}`;
    const group = groups.get(key) || [];
    group.push(contract);
    groups.set(key, group);
  }
  const unlinked = props.vehicles.filter(vehicle => !props.contracts.some(contract => contract.vehicle_id === vehicle.id));
  return <div className="space-y-5">
    {props.contracts.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Chưa có hợp đồng khoán tháng.</p>}
    <div className="grid items-start gap-5 xl:grid-cols-2">{[...groups].map(([key, contracts]) => <ContractPackage key={key} {...props} contracts={contracts} />)}</div>
    {unlinked.length > 0 && <section className="space-y-3"><h3 className="text-sm font-semibold text-slate-800">Phương tiện chưa có hợp đồng khoán tháng</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{unlinked.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={props.onEditVehicle} />)}</div></section>}
    {props.vehicles.length === 0 && <p className="text-sm text-slate-500">Chưa có phương tiện.</p>}
  </div>;
}
