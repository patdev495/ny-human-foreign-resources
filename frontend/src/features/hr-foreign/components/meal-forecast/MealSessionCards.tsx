import type { DailyMealForecastResponse, DailyMealSessionSummary } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  forecast: DailyMealForecastResponse;
  onLockSession: (session: DailyMealSessionSummary) => void;
  foreignLockDisabled?: boolean;
}

export function MealSessionCards({ forecast, onLockSession, foreignLockDisabled = false }: Props) {
  const sessions: { label: string; summary: DailyMealSessionSummary }[] = [
    { label: "Sáng · Nhân viên nước ngoài", summary: forecast.breakfast },
    { label: "Trưa · Tạp vụ", summary: forecast.lunch },
    { label: "Tối · Nhân viên nước ngoài", summary: forecast.dinner },
  ];
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Thống kê và chốt từng bữa ăn">
    <div className="overflow-x-auto" role="region" aria-label="Bảng chốt suất ăn" tabIndex={0}>
      <table className="w-full min-w-[940px] text-left text-sm">
        <caption className="sr-only">Số suất đề xuất, thực chốt và chi phí từng bữa ăn</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Bữa ăn", "Đề xuất (suất)", "Thực chốt (suất)", "Đơn giá chốt (đ)", "Thành tiền (đ)", "Trạng thái", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {sessions.map(({ label, summary }) => <tr key={summary.meal_session} className="hover:bg-slate-50">
            <th scope="row" className="px-3 py-3 font-medium text-slate-900">{label}{summary.notes && <span className="mt-1 block max-w-72 break-words text-xs font-normal text-slate-600">{summary.notes}</span>}</th>
            <td className="px-3 py-3 tabular-nums text-slate-600">{summary.calculated_meal_count}</td>
            <td className="px-3 py-3 tabular-nums text-slate-900">{summary.is_locked ? summary.final_meal_count ?? "—" : "—"}</td>
            <td className="px-3 py-3 tabular-nums text-slate-600">{summary.is_locked ? summary.locked_price_per_meal?.toLocaleString("vi-VN") ?? "—" : "—"}</td>
            <td className="px-3 py-3 font-medium tabular-nums text-slate-900">{summary.is_locked ? ((summary.final_meal_count ?? 0) * (summary.locked_price_per_meal ?? 0)).toLocaleString("vi-VN") : "—"}</td>
            <td className={`whitespace-nowrap px-3 py-3 ${summary.is_locked ? "text-slate-600" : "text-amber-800"}`}>{summary.is_locked ? "Đã chốt" : "Chưa chốt"}</td>
            <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => onLockSession(summary)} disabled={foreignLockDisabled && summary.meal_session !== "LUNCH"}
              aria-label={`${summary.is_locked ? "Chốt lại" : "Chốt"} ${label}`} className={`${systemTextButton} disabled:cursor-not-allowed disabled:opacity-50`}>{summary.is_locked ? "Chốt lại" : "Chốt suất ăn"}</button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}
