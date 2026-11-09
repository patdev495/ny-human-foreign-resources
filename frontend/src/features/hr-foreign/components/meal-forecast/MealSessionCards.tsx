import type { DailyMealForecastResponse, DailyMealSessionSummary } from "../../types";
import { systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  forecast: DailyMealForecastResponse;
  onLockSession: (session: DailyMealSessionSummary) => void;
  foreignLockDisabled?: boolean;
}

export function MealSessionCards({ forecast, onLockSession, foreignLockDisabled = false }: Props) {
  const sessions: { meal: string; group: string; label: string; summary: DailyMealSessionSummary }[] = [
    { meal: "Sáng", group: "Nhân viên nước ngoài", label: "Sáng · Nhân viên nước ngoài", summary: forecast.breakfast },
    { meal: "Trưa", group: "Tạp vụ", label: "Trưa · Tạp vụ", summary: forecast.lunch },
    { meal: "Tối", group: "Nhân viên nước ngoài", label: "Tối · Nhân viên nước ngoài", summary: forecast.dinner },
  ];
  return <section className="min-w-0" aria-label="Thống kê và chốt từng bữa ăn">
    <div className="space-y-3 lg:hidden">
      {sessions.map(({ meal, group, label, summary }) => <article key={summary.meal_session}
        aria-label={`Bữa ${label}`} className="min-w-0 rounded-sm border border-slate-200 bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Bữa {meal.toLocaleLowerCase("vi-VN")}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{group}</p>
            <p className={`mt-1 text-sm ${summary.is_locked ? "text-slate-600" : "text-amber-800"}`}>{summary.is_locked ? "Đã chốt" : "Chưa chốt"}</p>
          </div>
          <button type="button" onClick={() => onLockSession(summary)} disabled={foreignLockDisabled && summary.meal_session !== "LUNCH"}
            aria-label={`${summary.is_locked ? "Chốt lại" : "Chốt"} ${label}`}
            className={`${summary.is_locked ? systemSecondaryButton : systemPrimaryButton} min-h-12 min-w-28 shrink-0 disabled:cursor-not-allowed sm:min-h-12`}>
            {summary.is_locked ? "Chốt lại" : `Chốt ${meal.toLocaleLowerCase("vi-VN")}`}
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-3 text-sm">
          <div className="min-w-0"><dt className="text-slate-500">Đề xuất</dt><dd className="mt-0.5 break-words text-lg font-semibold tabular-nums text-slate-900">{summary.calculated_meal_count} <span className="text-sm font-normal">suất</span></dd></div>
          <div className="min-w-0"><dt className="text-slate-500">Thực chốt</dt><dd className="mt-0.5 break-words text-lg font-semibold tabular-nums text-slate-900">{summary.is_locked ? summary.final_meal_count ?? "—" : "—"}{summary.is_locked && summary.final_meal_count != null && <span className="text-sm font-normal"> suất</span>}</dd></div>
          {summary.is_locked && <>
            <div className="min-w-0"><dt className="text-slate-500">Đơn giá chốt</dt><dd className="mt-0.5 break-words tabular-nums text-slate-700">{summary.locked_price_per_meal?.toLocaleString("vi-VN") ?? "—"} đ</dd></div>
            <div className="min-w-0"><dt className="text-slate-500">Thành tiền</dt><dd className="mt-0.5 break-words font-medium tabular-nums text-slate-900">{((summary.final_meal_count ?? 0) * (summary.locked_price_per_meal ?? 0)).toLocaleString("vi-VN")} đ</dd></div>
          </>}
        </dl>
        {summary.notes && <p className="mt-3 break-words border-t border-slate-200 pt-2 text-sm text-slate-600">{summary.notes}</p>}
      </article>)}
    </div>
    <div className="hidden overflow-x-auto rounded-sm border border-slate-200 bg-white lg:block" role="region" aria-label="Bảng chốt suất ăn" tabIndex={0}>
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
