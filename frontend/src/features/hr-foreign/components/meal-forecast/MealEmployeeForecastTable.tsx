import { useState } from "react";
import { fetchMealReportHistory } from "../../api";
import type { DailyMealEmployeeItem, HrMealReportHistory } from "../../types";

interface Props {
  filteredEmployees: DailyMealEmployeeItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  lodgingFilter: "ALL" | "KTX" | "HOTEL";
  setLodgingFilter: (filter: "ALL" | "KTX" | "HOTEL") => void;
  date: string;
  usesMealReports: boolean;
}

const statusText: Record<DailyMealEmployeeItem["breakfast_report_status"], string> = {
  EATING: "Có ăn", NOT_EATING: "Đã báo không ăn", NOT_REPORTED: "Chưa báo cơm", INELIGIBLE: "Không thuộc diện",
};

function ReportStatus({ status }: { status: DailyMealEmployeeItem["breakfast_report_status"] }) {
  const color = status === "EATING" ? "bg-emerald-100 text-emerald-800"
    : status === "NOT_EATING" ? "bg-slate-100 text-slate-700"
      : status === "NOT_REPORTED" ? "bg-amber-100 text-amber-900" : "bg-slate-50 text-slate-500";
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${color}`}>{statusText[status]}</span>;
}

export function MealEmployeeForecastTable({ filteredEmployees, searchTerm, setSearchTerm, lodgingFilter, setLodgingFilter, date, usesMealReports }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [history, setHistory] = useState<HrMealReportHistory | null>(null);
  const [historyError, setHistoryError] = useState("");

  async function toggleHistory(employeeId: number) {
    if (openId === employeeId) { setOpenId(null); return; }
    setOpenId(employeeId);
    setHistory(null);
    setHistoryError("");
    try { setHistory(await fetchMealReportHistory(employeeId, date)); }
    catch { setHistoryError("Không thể tải lịch sử Báo cơm."); }
  }

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 text-xs font-bold">
        {(["ALL", "KTX", "HOTEL"] as const).map(item => <button key={item} type="button" onClick={() => setLodgingFilter(item)}
          className={`rounded-lg px-3 py-2 ${lodgingFilter === item ? "bg-indigo-700 text-white" : "bg-white text-slate-700"}`}>{item === "ALL" ? "Tất cả" : item === "KTX" ? "KTX" : "Khách sạn"}</button>)}
      </div>
      <input aria-label="Tìm nhân sự" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Tìm tên, mã NV, phòng..." className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:w-72" />
    </div>
    {usesMealReports && <p className="border-b border-slate-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">Suất Sáng/Tối lấy từ Báo cơm hiện hành. HR xem chi tiết và lịch sử tại từng người.</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="bg-slate-100 text-slate-600"><tr>
        <th className="px-4 py-3">Mã NV</th><th className="px-4 py-3">Nhân viên nước ngoài</th><th className="px-4 py-3">Chỗ ở</th><th className="px-4 py-3">Sáng</th><th className="px-4 py-3">Tối</th><th className="px-4 py-3">Chi tiết</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {filteredEmployees.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy nhân sự.</td></tr>}
        {filteredEmployees.map(employee => <tr key={employee.employee_id} className="align-top">
          <td className="px-4 py-3 font-mono">{employee.employee_code ?? `#${employee.employee_id}`}</td>
          <td className="px-4 py-3"><span className="font-bold">{employee.name_latin}</span>{employee.name_chinese && <span className="block text-slate-500">{employee.name_chinese}</span>}</td>
          <td className="px-4 py-3">{employee.location_name}</td>
          <td className="px-4 py-3">{usesMealReports ? <ReportStatus status={employee.breakfast_report_status} /> : (employee.has_meals && !employee.is_breakfast_absent) || employee.is_breakfast_extra ? "Có ăn (cũ)" : "Không ăn (cũ)"}</td>
          <td className="px-4 py-3">{usesMealReports ? <ReportStatus status={employee.dinner_report_status} /> : (employee.has_meals && !employee.is_dinner_absent) || employee.is_dinner_extra ? "Có ăn (cũ)" : "Không ăn (cũ)"}</td>
          <td className="px-4 py-3">{usesMealReports && <button type="button" onClick={() => void toggleHistory(employee.employee_id)} className="font-semibold text-indigo-700 underline">{openId === employee.employee_id ? "Đóng" : "Báo cơm"}</button>}
            {openId === employee.employee_id && <div className="mt-2 min-w-48 rounded-xl bg-slate-50 p-3 text-xs">
              {historyError || (!history ? "Đang tải..." : history.history.length === 0 ? "Chưa báo cơm" : <>
                <p className="mb-2 font-bold">Lịch sử gửi/sửa</p>
                {history.history.map((item, index) => <p key={index} className="border-t border-slate-200 py-2">{new Date(item.submitted_at).toLocaleString("vi-VN")} · Sáng {item.breakfast ? "Ăn" : "Không"}, Tối {item.dinner ? "Ăn" : "Không"}</p>)}
              </>)}
            </div>}
          </td>
        </tr>)}
      </tbody>
    </table></div>
  </section>;
}
