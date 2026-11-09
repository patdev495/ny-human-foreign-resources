import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DailyMealEmployeeItem } from "../../types";

interface Props {
  employees: DailyMealEmployeeItem[];
  date: string;
}

export function MealReportingStatus({ employees, date }: Props) {
  const [expanded, setExpanded] = useState(false);
  const notReported = employees.filter((employee) => employee.breakfast_report_status === "NOT_REPORTED" || employee.dinner_report_status === "NOT_REPORTED");
  return <section className={`rounded-sm border bg-white ${notReported.length ? "border-amber-200" : "border-slate-200"}`} aria-label="Nhân sự chưa báo cơm">
    <h2><button type="button" aria-expanded={expanded} aria-controls="meal-not-reported-list" onClick={() => setExpanded((value) => !value)}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
      <span className={notReported.length ? "text-amber-800" : "text-slate-700"}>Chưa báo cơm <strong className="font-semibold">({notReported.length} người)</strong><span className="ml-2 hidden font-normal text-slate-600 sm:inline">Ngày {date.split("-").reverse().join("/")}</span></span>
      <span className="flex items-center gap-2 text-xs text-slate-600">{expanded ? "Thu gọn" : "Xem danh sách"}<ChevronDown className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></span>
    </button></h2>
    {expanded && <div id="meal-not-reported-list" className="border-t border-slate-200 px-4">
      {notReported.length === 0 ? <p className="py-4 text-sm text-slate-600">Không có người chưa báo cơm.</p> : <ul className="divide-y divide-slate-200">
        {notReported.map((employee) => <li key={employee.employee_id} className="py-3 text-sm">
          <span className="font-medium text-slate-900">{employee.name_latin}</span>{employee.name_chinese && <span className="ml-2 text-slate-600">{employee.name_chinese}</span>}
          <p className="mt-1 text-xs text-slate-600">{employee.employee_code ?? `#${employee.employee_id}`} · {employee.location_name}</p>
        </li>)}
      </ul>}
    </div>}
  </section>;
}
