import React, { useState, useEffect } from "react";
import type { MealExpenseReportResponse } from "../types";
import { fetchMealExpenseReport } from "../api";

export const MealExpenseReport: React.FC = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [report, setReport] = useState<MealExpenseReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = React.useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMealExpenseReport(startDate, endDate);
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6 print:shadow-none print:border-none print:p-0">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 print:pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Tổng hợp Chi phí Suất ăn KTX</h2>
          <p className="text-sm text-slate-500">
            Truy vấn & tính toán tổng số bữa ăn, chi phí suất ăn theo khoảng thời gian thực tế
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadReport}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Tra cứu
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg cursor-pointer transition-colors"
          >
            In / Export
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tổng hợp chi phí suất ăn...</div>
      ) : !report ? null : (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-medium text-slate-500">Số Nhân sự KTX Ăn</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{report.total_employees} người</div>
            </div>
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div className="text-xs font-medium text-blue-700">Tổng Ngày Lưu Trú</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{report.total_stay_days} ngày</div>
            </div>
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <div className="text-xs font-medium text-emerald-700">Tổng Số Suất Ăn</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">{report.total_meals} suất</div>
            </div>
            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl">
              <div className="text-xs font-medium text-purple-700">Tổng Thành Tiền</div>
              <div className="text-xl font-bold text-purple-900 mt-1">
                {report.total_expense.toLocaleString("vi-VN")} VNĐ
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Nhân Sự</th>
                  <th className="px-4 py-3">Hộ Chiếu</th>
                  <th className="px-4 py-3">Phòng KTX</th>
                  <th className="px-4 py-3 text-center">Số Ngày Ở</th>
                  <th className="px-4 py-3 text-center">Số Ngày Vắng</th>
                  <th className="px-4 py-3 text-center">Ngày Thường</th>
                  <th className="px-4 py-3 text-center">Ngày Sự Kiện</th>
                  <th className="px-4 py-3 text-center">Tổng Bữa</th>
                  <th className="px-4 py-3 text-right">Thành Tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Không có dữ liệu suất ăn KTX trong khoảng thời gian đã chọn.
                    </td>
                  </tr>
                ) : (
                  report.items.map((item, idx) => {
                    const isUnassigned =
                      !item.room_number ||
                      item.room_number === "N/A" ||
                      item.room_number === "Chưa xếp" ||
                      item.room_number === "-";
                    return (
                      <tr
                        key={item.employee_id}
                        className={`transition-colors ${
                          isUnassigned
                            ? "bg-amber-50/60 hover:bg-amber-100/60"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.employee_name}
                          {item.name_chinese && (
                            <span className="ml-1 text-xs text-slate-500 font-normal">({item.name_chinese})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{item.passport_number || "-"}</td>
                        <td className="px-4 py-3">
                          {isUnassigned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              ⚠️ Chưa xếp phòng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-800 bg-slate-100">
                              Phòng {item.room_number}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{item.stay_days}</td>
                        <td className="px-4 py-3 text-center font-mono text-rose-600">
                          {item.absent_days > 0 ? `-${item.absent_days}` : "0"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{item.normal_days}</td>
                        <td className="px-4 py-3 text-center font-mono text-purple-700 font-semibold">
                          {item.event_days > 0 ? `${item.event_days}` : "0"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-700">
                          {item.meal_count}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {item.total_cost.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {report.items.length > 0 && (
                <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td colSpan={4} className="px-4 py-3">TỔNG CỘNG HỆ THỐNG</td>
                    <td className="px-4 py-3 text-center font-mono">{report.total_stay_days}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {report.items.reduce((s, i) => s + i.absent_days, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {report.items.reduce((s, i) => s + i.normal_days, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-purple-800">
                      {report.items.reduce((s, i) => s + i.event_days, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-blue-900">{report.total_meals}</td>
                    <td className="px-4 py-3 text-right font-mono text-purple-900 text-base">
                      {report.total_expense.toLocaleString("vi-VN")} VNĐ
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
