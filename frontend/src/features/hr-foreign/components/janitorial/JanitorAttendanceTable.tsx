import { useEffect, useState } from "react";
import type { JanitorAttendanceItem } from "../../api/janitorApi";
import { janitorLocationLabel } from "./janitorUtils";
import { systemField } from "../../../../shared/components/systemStyles";

export type AttendanceChoice = "PRESENT" | "FULL_DAY" | "HALF_DAY";
export type AttendanceFilter = "ALL" | AttendanceChoice;

interface Props {
  items: JanitorAttendanceItem[];
  savingId: number | null;
  onChange: (employeeId: number, type: AttendanceChoice, reason: string) => Promise<void>;
}

function AttendanceRow({ item, index, savingId, onChange }: { item: JanitorAttendanceItem; index: number; savingId: number | null; onChange: Props["onChange"] }) {
  const [reason, setReason] = useState(item.reason || "");
  useEffect(() => { setReason(item.reason || ""); }, [item.reason]);
  const active: AttendanceChoice = item.status === "PRESENT" ? "PRESENT" : item.absence_type || "FULL_DAY";
  const choices: { value: AttendanceChoice; label: string }[] = [
    { value: "PRESENT", label: "Đi làm" }, { value: "FULL_DAY", label: "Nghỉ cả ngày" }, { value: "HALF_DAY", label: "Nghỉ nửa ngày" },
  ];
  return <tr className="hover:bg-slate-50">
    <td className="px-3 py-3 tabular-nums text-slate-500">{index + 1}</td>
    <td className="px-3 py-3 text-slate-600">{item.employee_code || "—"}</td>
    <th scope="row" className="min-w-40 px-3 py-3 font-medium text-slate-900">{item.name_latin}{item.name_chinese && <span className="mt-0.5 block text-xs font-normal text-slate-600">{item.name_chinese}</span>}</th>
    <td className="px-3 py-3 text-slate-600">{janitorLocationLabel(item.workplace_location)}</td>
    <td className="px-3 py-2">
      <div className="flex gap-1.5" role="group" aria-label={`Điểm danh ${item.name_latin}`}>
        {choices.map((choice) => <button key={choice.value} type="button" aria-pressed={active === choice.value} data-attendance-action={item.employee_id}
          onClick={() => void onChange(item.employee_id, choice.value, reason)} disabled={savingId !== null}
          className={`min-h-11 cursor-pointer whitespace-nowrap rounded-sm border px-2 py-1.5 text-sm disabled:cursor-wait disabled:opacity-50 sm:min-h-9 ${active === choice.value ? "border-slate-600 bg-slate-100 font-medium text-slate-900" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}>
          {choice.label}
        </button>)}
      </div>
      {savingId === item.employee_id && <span role="status" className="mt-1 block text-xs text-slate-600">Đang lưu…</span>}
    </td>
    <td className="min-w-56 px-3 py-2">{active === "PRESENT" ? <span className="text-slate-500">—</span> : <input aria-label={`Lý do nghỉ của ${item.name_latin}`}
      value={reason} onChange={(event) => setReason(event.target.value)} disabled={savingId !== null} placeholder="Nhập lý do nghỉ…" className={systemField}
      onBlur={(event) => {
        if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.dataset.attendanceAction === String(item.employee_id)) return;
        if (reason.trim() !== (item.reason || "").trim()) void onChange(item.employee_id, active, reason);
      }} />}</td>
  </tr>;
}

export function JanitorAttendanceTable({ items, savingId, onChange }: Props) {
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Điểm danh tạp vụ">
    <div className="overflow-x-auto" role="region" aria-label="Bảng điểm danh tạp vụ" tabIndex={0}>
      <table className="w-full min-w-[1050px] text-left text-sm">
        <caption className="sr-only">Trạng thái điểm danh và lý do nghỉ của tạp vụ theo ngày</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["STT", "Mã nhân sự", "Họ và tên", "Nơi làm việc", "Trạng thái điểm danh", "Lý do nghỉ"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {items.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">Không tìm thấy tạp vụ phù hợp với ngày và bộ lọc.</td></tr>
            : items.map((item, index) => <AttendanceRow key={item.employee_id} item={item} index={index} savingId={savingId} onChange={onChange} />)}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {items.length} nhân sự tạp vụ</p>
  </section>;
}
