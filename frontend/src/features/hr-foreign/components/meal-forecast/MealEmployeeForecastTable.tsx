import { Fragment, useEffect, useRef, useState } from "react";
import { fetchMealReportHistory } from "../../api";
import type { DailyMealEmployeeItem, HrMealReportHistory } from "../../types";
import { SystemTabs } from "../../../../shared/components/SystemTabs";
import { systemField, systemTextButton } from "../../../../shared/components/systemStyles";

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
  return <span className={status === "NOT_REPORTED" ? "text-amber-800" : "text-slate-700"}>{statusText[status]}</span>;
}

export function MealEmployeeForecastTable({ filteredEmployees, searchTerm, setSearchTerm, lodgingFilter, setLodgingFilter, date, usesMealReports }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [history, setHistory] = useState<HrMealReportHistory | null>(null);
  const [historyError, setHistoryError] = useState("");
  const historySequence = useRef(0);
  useEffect(() => () => { historySequence.current += 1; }, []);

  async function toggleHistory(employeeId: number): Promise<void> {
    const sequence = ++historySequence.current;
    if (openId === employeeId) { setOpenId(null); return; }
    setOpenId(employeeId);
    setHistory(null);
    setHistoryError("");
    try {
      const result = await fetchMealReportHistory(employeeId, date);
      if (sequence === historySequence.current) setHistory(result);
    } catch { if (sequence === historySequence.current) setHistoryError("Không thể tải lịch sử Báo cơm."); }
  }

  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Danh sách suất ăn nhân sự">
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
      <div className="min-w-0 flex-1 basis-64"><label htmlFor="meal-employee-search" className="mb-1.5 block text-sm text-slate-600">Tìm nhân sự</label>
        <input id="meal-employee-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tên, mã nhân sự, phòng…" className={systemField} /></div>
      <div className="w-full sm:w-auto"><SystemTabs label="Lọc chỗ ở của nhân sự" active={lodgingFilter} onChange={setLodgingFilter} items={[
        { key: "ALL", label: "Tất cả" }, { key: "KTX", label: "KTX" }, { key: "HOTEL", label: "Khách sạn" },
      ]} /></div>
    </div>
    <p className="border-b border-slate-200 px-4 py-3 text-xs text-slate-600">{usesMealReports ? "Trạng thái Sáng/Tối lấy từ Báo cơm. Mở lịch sử để đối chiếu các lần gửi và sửa." : "Dữ liệu theo quy trình vắng ăn cũ của ngày đang xem."}</p>
    <div className="overflow-x-auto" role="region" aria-label="Bảng báo cơm theo nhân sự" tabIndex={0}>
      <table className="w-full min-w-[780px] text-left text-sm">
        <caption className="sr-only">Trạng thái bữa sáng và tối của từng nhân viên nước ngoài</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Mã nhân sự", "Nhân viên nước ngoài", "Chỗ ở", "Sáng", "Tối", "Chi tiết"].map((label) => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {filteredEmployees.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-600">Không tìm thấy nhân sự phù hợp.</td></tr>}
          {filteredEmployees.map((employee) => <Fragment key={employee.employee_id}>
            <tr className="hover:bg-slate-50">
              <td className="px-3 py-3 text-slate-600">{employee.employee_code ?? `#${employee.employee_id}`}</td>
              <th scope="row" className="px-3 py-3 text-left font-medium text-slate-900">{employee.name_latin}{employee.name_chinese && <span className="mt-0.5 block text-xs font-normal text-slate-600">{employee.name_chinese}</span>}</th>
              <td className="px-3 py-3 text-slate-600">{employee.location_name}</td>
              <td className="px-3 py-3">{usesMealReports ? <ReportStatus status={employee.breakfast_report_status} /> : (employee.has_meals && !employee.is_breakfast_absent) || employee.is_breakfast_extra ? "Có ăn" : "Không ăn"}</td>
              <td className="px-3 py-3">{usesMealReports ? <ReportStatus status={employee.dinner_report_status} /> : (employee.has_meals && !employee.is_dinner_absent) || employee.is_dinner_extra ? "Có ăn" : "Không ăn"}</td>
              <td className="px-3 py-2">{usesMealReports && <button type="button" onClick={() => void toggleHistory(employee.employee_id)} aria-expanded={openId === employee.employee_id} aria-controls={`meal-history-${employee.employee_id}`} className={systemTextButton}>{openId === employee.employee_id ? "Đóng lịch sử" : "Lịch sử báo cơm"}</button>}</td>
            </tr>
            {openId === employee.employee_id && <tr id={`meal-history-${employee.employee_id}`}><td colSpan={6} className="bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {historyError ? <p role="alert">{historyError}</p> : !history ? <p role="status">Đang tải lịch sử…</p> : history.history.length === 0 ? "Chưa có lịch sử Báo cơm." : <ul className="divide-y divide-slate-200">
                {history.history.map((item, index) => <li key={index} className="py-2">{new Date(item.submitted_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · Sáng: {item.breakfast ? "Có ăn" : "Không ăn"} · Tối: {item.dinner ? "Có ăn" : "Không ăn"}</li>)}
              </ul>}
            </td></tr>}
          </Fragment>)}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {filteredEmployees.length} nhân sự</p>
  </section>;
}
