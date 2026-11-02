import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DailyMealEmployeeItem } from "../../types";

interface Props {
  employees: DailyMealEmployeeItem[];
  date: string;
}

export function MealReportingStatus({ employees, date }: Props) {
  const [expanded, setExpanded] = useState(false);
  const notReported = employees.filter(employee =>
    employee.breakfast_report_status === "NOT_REPORTED"
    || employee.dinner_report_status === "NOT_REPORTED"
  );

  return <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
    <h2>
      <button type="button" aria-expanded={expanded} aria-controls="meal-not-reported-list"
        onClick={() => setExpanded(current => !current)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-600">
        <span>
          <span className="block font-bold text-slate-900">Chưa báo cơm</span>
          <span className="mt-1 block text-sm font-normal text-slate-600">Ngày {date.split("-").reverse().join("/")} · Bấm để xem danh sách</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900" aria-label={`${notReported.length} người`}>{notReported.length} người</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>
    </h2>
    {expanded && <div id="meal-not-reported-list" className="border-t border-slate-100 px-5">
      {notReported.length === 0 ? <p className="py-4 text-sm text-slate-500">Không có người chưa báo cơm.</p> :
        <ul className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-y-0 md:gap-x-6">
          {notReported.map(employee => <li key={employee.employee_id} className="border-b border-slate-100 py-3 text-sm">
            <span className="font-semibold text-slate-800">{employee.name_latin}</span>
            {employee.name_chinese && <span className="ml-2 text-slate-500">{employee.name_chinese}</span>}
            <span className="block text-xs text-slate-500">{employee.employee_code ?? `#${employee.employee_id}`} · {employee.location_name}</span>
          </li>)}
        </ul>}
    </div>}
  </section>;
}
