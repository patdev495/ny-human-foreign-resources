import { useId } from "react";
import type { DemandGroup, DemandKey } from "../../endShiftApi";
import { demandTotals, groupLabels, type GroupFilter } from "./endShiftView";

interface Props {
  groups: DemandGroup[];
  active: GroupFilter;
  onChange: (filter: GroupFilter) => void;
}
const locations: { label: string; at1730: DemandKey; at2000: DemandKey }[] = [
  { label: "CN09", at1730: "CN09_1730", at2000: "CN09_2000" },
  { label: "CN15", at1730: "CN15_1730", at2000: "CN15_2000" },
];

export function EndShiftOverview({ groups, active, onChange }: Props) {
  const id = useId();
  const totals = demandTotals(groups);
  const summaries: { key: GroupFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả nhân sự", count: totals.total },
    { key: "NEEDS_CAR", label: "Cần xe về KTX", count: totals.car },
    { key: "SELF_TRAVEL", label: "Tự di chuyển", count: totals.self },
    { key: "NOT_REPORTED", label: "Chưa báo", count: totals.missing },
  ];
  const buttonClass = (selected: boolean) => `min-h-12 w-full cursor-pointer rounded-sm border px-2 py-2 text-sm ${selected ? "border-slate-700 bg-slate-100 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`;
  function groupButton(key: DemandKey) {
    const group = groups.find(item => item.key === key);
    return <button type="button" aria-pressed={active === key} aria-label={`${groupLabels[key]}: ${group?.count ?? 0} người. Xem danh sách`}
      onClick={() => onChange(key)} className={buttonClass(active === key)}><span className="text-lg font-semibold tabular-nums">{group?.count ?? 0}</span></button>;
  }
  return <section aria-labelledby={id} className="space-y-3 lg:hidden">
    <h2 id={id} className="text-base font-semibold text-slate-900">Nhu cầu xe tan làm</h2>
    <div role="group" aria-label="Thống kê và lọc nhu cầu xe" className="grid grid-cols-2 gap-2">
      {summaries.map(item => <button key={item.key} type="button" aria-pressed={active === item.key} onClick={() => onChange(item.key)} className={`${buttonClass(active === item.key)} text-left`}>
        <span className={`block ${item.key === "NOT_REPORTED" && item.count > 0 ? "text-amber-800" : ""}`}>{item.label}</span>
        <span className="mt-1 block text-xl font-semibold tabular-nums">{item.count} <span className="text-sm font-normal">người</span></span>
      </button>)}
    </div>
    <div className="rounded-sm border border-slate-200 bg-white p-2">
      <table className="w-full table-fixed text-center text-sm text-slate-700">
        <caption className="pb-2 text-left text-sm text-slate-500">Bấm số người để lọc danh sách theo giờ tan làm.</caption>
        <thead><tr>{["Điểm đón", "17h30", "20h00", "Tổng"].map(label => <th key={label} scope="col" className="px-1 py-2 font-medium">{label}</th>)}</tr></thead>
        <tbody>{locations.map(location => <tr key={location.label} className="border-t border-slate-200">
          <th scope="row" className="px-1 py-2 font-medium">{location.label}</th>
          <td className="p-1">{groupButton(location.at1730)}</td><td className="p-1">{groupButton(location.at2000)}</td>
          <td className="px-1 py-2 font-semibold tabular-nums">{location.label === "CN09" ? totals.cn09 : totals.cn15}</td>
        </tr>)}</tbody>
        <tfoot><tr className="border-t border-slate-200"><th scope="row" className="px-1 py-3 font-medium">Tổng</th><td className="px-1 py-3 font-semibold tabular-nums">{totals.at1730}</td><td className="px-1 py-3 font-semibold tabular-nums">{totals.at2000}</td><td className="px-1 py-3 font-semibold tabular-nums">{totals.car}</td></tr></tfoot>
      </table>
    </div>
    <p className="text-xs text-slate-500">Người chưa báo không tính vào nhu cầu xe.</p>
  </section>;
}
