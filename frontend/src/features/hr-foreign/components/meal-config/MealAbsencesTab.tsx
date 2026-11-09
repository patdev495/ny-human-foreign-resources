import { systemField, systemPrimaryButton } from "../../../../shared/components/systemStyles";
import React, { useState, useEffect } from "react";
import type { ForeignEmployee, MealAbsence, Stay } from "../../types";
import {
  createMealAbsence,
  deleteMealAbsence,
  fetchDailyMealForecast,
  fetchMealAbsences,
} from "../../api";

interface Props {
  stays: Stay[];
  employees: ForeignEmployee[];
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export const MealAbsencesTab: React.FC<Props> = ({
  stays,
  employees,
  setError,
  setSuccessMsg,
}) => {
  const [selectedStayId, setSelectedStayId] = useState<number | "">("");
  const [absences, setAbsences] = useState<MealAbsence[]>([]);
  const [absDate, setAbsDate] = useState("");
  const [absMealType, setAbsMealType] = useState<"BREAKFAST" | "DINNER" | "ALL_DAY">("ALL_DAY");
  const [absReason, setAbsReason] = useState("");
  const [usesMealReports, setUsesMealReports] = useState(false);
  const [checkingDate, setCheckingDate] = useState(false);
  const [dateCheckFailed, setDateCheckFailed] = useState(false);

  useEffect(() => {
    if (!absDate) {
      setUsesMealReports(false);
      setDateCheckFailed(false);
      return;
    }
    let cancelled = false;
    setCheckingDate(true);
    setDateCheckFailed(false);
    void fetchDailyMealForecast(absDate).then((forecast) => {
      if (!cancelled) setUsesMealReports(forecast.uses_meal_reports);
    }).catch(() => {
      if (!cancelled) {
        setDateCheckFailed(true);
        setError("Không thể kiểm tra nguồn dữ liệu ngày ăn. Vui lòng thử lại.");
      }
    }).finally(() => {
      if (!cancelled) setCheckingDate(false);
    });
    return () => { cancelled = true; };
  }, [absDate, setError]);

  useEffect(() => {
    if (stays.length > 0 && !selectedStayId) {
      setSelectedStayId(stays[0].id);
    }
  }, [stays, selectedStayId]);

  const loadAbsencesForStay = async (stayId: number) => {
    try {
      const data = await fetchMealAbsences(stayId);
      setAbsences(data);
    } catch (err) {
      console.error("Failed to fetch absences:", err);
    }
  };

  useEffect(() => {
    if (selectedStayId) {
      loadAbsencesForStay(Number(selectedStayId));
    } else {
      setAbsences([]);
    }
  }, [selectedStayId]);

  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStayId) return;
    if (!absDate) {
      setError("Vui lòng chọn ngày báo vắng");
      return;
    }
    if (checkingDate || dateCheckFailed || usesMealReports) {
      setError("Ngày này lấy trạng thái Sáng/Tối từ cổng Báo cơm 8006. Chỉ điều chỉnh tổng số suất khi chốt bữa.");
      return;
    }

    try {
      await createMealAbsence(Number(selectedStayId), {
        absence_date: absDate,
        meal_type: absMealType,
        reason: absReason.trim() || undefined,
      });

      setSuccessMsg(" Đã đăng ký ngày báo vắng ăn thành công!");
      setAbsDate("");
      setAbsReason("");
      loadAbsencesForStay(Number(selectedStayId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tạo ngày báo vắng");
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!window.confirm("Xóa ngày báo vắng ăn này?")) return;
    try {
      await deleteMealAbsence(id);
      setSuccessMsg(" Đã xóa ngày báo vắng");
      if (selectedStayId) loadAbsencesForStay(Number(selectedStayId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể xóa ngày báo vắng");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-sm p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
           Đăng ký Báo vắng ăn theo Lượt lưu trú
        </h3>
        <form onSubmit={handleCreateAbsence} className="space-y-4">
          {usesMealReports && <p role="status" className="rounded-sm bg-indigo-50 p-3 text-sm text-slate-700">Từ ngày này, trạng thái Sáng/Tối chỉ đọc từ Báo cơm 8006. HR có thể điều chỉnh tổng số suất trong lúc chốt bữa và phải ghi lý do.</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="meal-absence-stay" className="block text-sm font-medium text-slate-700 mb-1">
                Chọn Nhân sự / Đợt ở KTX
              </label>
              <select id="meal-absence-stay"
                value={selectedStayId}
                onChange={(e) => setSelectedStayId(Number(e.target.value))}
                className={systemField}
              >
                {stays
                  .filter((s) => s.accommodation_type === "KTX")
                  .map((s) => {
                    const emp = employees.find((e) => e.id === s.employee_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {emp ? emp.name_latin : `NV #${s.employee_id}`} - Phòng {s.room_number || "KTX"}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div>
              <label htmlFor="meal-absence-date" className="block text-sm font-medium text-slate-700 mb-1">
                Ngày báo vắng
              </label>
              <input id="meal-absence-date"
                type="date"
                value={absDate}
                onChange={(e) => setAbsDate(e.target.value)}
                className={systemField}
              />
            </div>
            <div>
              <label htmlFor="meal-absence-session" className="block text-sm font-medium text-slate-700 mb-1">
                Bữa ăn cắt cơm
              </label>
              <select id="meal-absence-session"
                value={absMealType}
                onChange={(e) => setAbsMealType(e.target.value as "BREAKFAST" | "DINNER" | "ALL_DAY")}
                className={systemField}
              >
                <option value="ALL_DAY">Cả ngày (Sáng & Tối)</option>
                <option value="BREAKFAST">Bữa Sáng</option>
                <option value="DINNER">Bữa Tối</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="meal-absence-reason" className="block text-sm font-medium text-slate-700 mb-1">
              Lý do báo vắng (Tùy chọn)
            </label>
            <input id="meal-absence-reason"
              type="text"
              placeholder="VD: Đi công tác ngoài, Về quê nghỉ phép..."
              value={absReason}
              onChange={(e) => setAbsReason(e.target.value)}
              className={systemField}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={checkingDate || dateCheckFailed || usesMealReports}
              className={systemPrimaryButton}
            >
               Đăng ký Vắng ăn
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="font-semibold text-slate-800">
             Lịch sử Ngày báo vắng ăn của Nhân sự ({absences.length})
          </h4>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Bảng vắng ăn" tabIndex={0}>
          <table className="w-full min-w-[720px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">STT</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Ngày Báo vắng</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Bữa vắng ăn</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Lý do</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {absences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 italic">
                    Chưa có ngày báo vắng nào cho đợt ở này.
                  </td>
                </tr>
              ) : (
                absences.map((ab, idx) => (
                  <tr key={ab.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{ab.absence_date}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {ab.meal_type === "BREAKFAST"
                        ? "Bữa Sáng"
                        : ab.meal_type === "DINNER"
                        ? "Bữa Tối"
                        : "Cả ngày (Sáng & Tối)"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ab.reason || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAbsence(ab.id)}
                        className="min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
